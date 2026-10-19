import { Router } from 'express'
import multer from 'multer'
import bcrypt from 'bcrypt'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import pool from '../../config/db.js'
import authenticate from '../../middleware/auth.js'
import authorize from '../../middleware/authorize.js'

const router = Router()
const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads')
fs.mkdirSync(uploadDir, { recursive: true })
const allowedImages = new Set(['image/jpeg', 'image/png', 'image/webp'])
const allowedDocuments = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    const valid = ['photo', 'profilePhoto'].includes(file.fieldname) ? allowedImages.has(file.mimetype) : file.fieldname === 'document' && allowedDocuments.has(file.mimetype)
    callback(valid ? null : new Error('Upload a JPG, PNG, or WebP photo and an optional PDF or Word document.'), valid)
  },
})
const fields = upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'document', maxCount: 1 }])
const uploadsMiddleware = (req, res, next) => fields(req, res, (error) => {
  if (error) return res.status(400).json({ error: error.message || 'The uploaded file is invalid.' })
  next()
})
const profilePhotoMiddleware = (req, res, next) => upload.single('profilePhoto')(req, res, (error) => {
  if (error) return res.status(400).json({ error: error.message || 'The profile photo is invalid.' })
  next()
})
const fileUrl = (file) => file ? `/uploads/${file.filename}` : null
const removeFile = (url) => {
  if (!url || !url.startsWith('/uploads/')) return
  fs.promises.unlink(path.join(uploadDir, path.basename(url))).catch(() => {})
}
const valuesFromBody = (body) => ({
  title: String(body.title || '').trim(),
  description: String(body.description || '').trim(),
  vehicleType: String(body.vehicleType || '').trim(),
  lotNumber: String(body.lotNumber || '').trim(),
  initialPrice: Number(body.initialPrice),
  minimumIncrement: Number(body.minimumIncrement),
  maximumPrice: body.maximumPrice === '' || body.maximumPrice == null ? null : Number(body.maximumPrice),
  startsAt: body.startsAt,
  endsAt: body.endsAt,
  status: ['published', 'closed', 'cancelled'].includes(body.status) ? body.status : 'draft',
})
const validate = (item) => {
  if (!item.title || item.title.length > 180 || !item.description || !item.vehicleType || item.vehicleType.length > 100 || !item.lotNumber || item.lotNumber.length > 60) return 'Enter a title, description, vehicle type, and lot number.'
  if (!Number.isFinite(item.initialPrice) || item.initialPrice < 0 || !Number.isFinite(item.minimumIncrement) || item.minimumIncrement <= 0) return 'Enter a valid starting price and a minimum increment greater than zero.'
  if (item.maximumPrice !== null && (!Number.isFinite(item.maximumPrice) || item.maximumPrice < item.initialPrice)) return 'Maximum price must be greater than or equal to the initial price.'
  const start = Date.parse(item.startsAt)
  const end = Date.parse(item.endsAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 'Choose a valid end date and time after the start date.'
  return null
}
const publicItem = (row) => ({
  id: row.id, title: row.title, description: row.description, vehicleType: row.vehicle_type,
  lotNumber: row.lot_number, initialPrice: row.initial_price, minimumIncrement: row.minimum_increment,
  maximumPrice: row.maximum_price, startsAt: row.starts_at, endsAt: row.ends_at,
  status: row.status, photoUrl: row.photo_path, documentUrl: row.document_path,
  documentName: row.document_name, createdAt: row.created_at, updatedAt: row.updated_at,
})

router.use(authenticate, authorize('procurement'))

router.get('/profile', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id,u.first_name,u.last_name,u.legal_name,u.email,u.phone,u.gender,u.username,u.preferred_language,u.role,u.created_at,
              p.organization_name,p.department,p.job_title,p.profile_photo_path
       FROM users u LEFT JOIN procurement_profiles p ON p.user_id=u.id WHERE u.id=$1`,
      [req.user.sub],
    )
    if (!rows.length) return res.status(404).json({ error: 'Procurement profile not found.' })
    const row = rows[0]
    res.json({ profile: { id: row.id, firstName: row.first_name, lastName: row.last_name, legalName: row.legal_name, email: row.email, phone: row.phone, gender: row.gender, username: row.username, preferredLanguage: row.preferred_language, role: row.role, createdAt: row.created_at, organizationName: row.organization_name || row.legal_name, department: row.department || '', jobTitle: row.job_title || '', profilePhotoUrl: row.profile_photo_path } })
  } catch (error) {
    console.error('Could not load procurement profile:', error.message)
    res.status(500).json({ error: 'Could not load your profile.' })
  }
})

router.put('/profile', profilePhotoMiddleware, async (req, res) => {
  const body = req.body || {}
  const values = {
    firstName: String(body.firstName || '').trim(), lastName: String(body.lastName || '').trim(),
    legalName: String(body.legalName || '').trim(), email: String(body.email || '').trim().toLowerCase(),
    phone: String(body.phone || '').trim(), gender: String(body.gender || ''), username: String(body.username || '').trim(),
    preferredLanguage: String(body.preferredLanguage || 'en'), organizationName: String(body.organizationName || '').trim(),
    department: String(body.department || '').trim(), jobTitle: String(body.jobTitle || '').trim(),
    currentPassword: String(body.currentPassword || ''), newPassword: String(body.newPassword || ''),
  }
  const validGender = ['male', 'female', 'prefer_not_to_say'].includes(values.gender)
  if (!values.firstName || values.firstName.length > 80 || !values.lastName || values.lastName.length > 80 || !values.legalName || values.legalName.length > 180 || !values.organizationName || values.organizationName.length > 180 || values.department.length > 180 || values.jobTitle.length > 120) {
    removeFile(fileUrl(req.file))
    return res.status(400).json({ error: 'Complete your name and organization fields within the allowed lengths.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254 || !/^[+\d][\d\s().-]{5,29}$/.test(values.phone) || values.phone.length > 30 || !/^[A-Za-z0-9._-]{3,50}$/.test(values.username) || !validGender || !['en', 'am', 'om'].includes(values.preferredLanguage)) {
    removeFile(fileUrl(req.file))
    return res.status(400).json({ error: 'Check your email, phone, username, gender, and language selections.' })
  }
  if (values.newPassword && (values.newPassword.length < 6 || Buffer.byteLength(values.newPassword, 'utf8') > 72 || !values.currentPassword)) {
    removeFile(fileUrl(req.file))
    return res.status(400).json({ error: 'Enter your current password and a new password of at least 6 characters (72 UTF-8 bytes maximum).' })
  }

  const client = await pool.connect()
  let oldPhoto = null
  try {
    await client.query('BEGIN')
    const userResult = await client.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE', [req.user.sub])
    if (!userResult.rowCount) throw new Error('Procurement account not found.')
    if (values.newPassword) {
      if (!(await bcrypt.compare(values.currentPassword, userResult.rows[0].password_hash))) {
        await client.query('ROLLBACK')
        removeFile(fileUrl(req.file))
        return res.status(400).json({ error: 'Current password is incorrect.' })
      }
    }
    const oldResult = await client.query('SELECT profile_photo_path FROM procurement_profiles WHERE user_id=$1', [req.user.sub])
    oldPhoto = oldResult.rows[0]?.profile_photo_path || null
    const photoPath = fileUrl(req.file) || oldPhoto
    const updateUser = values.newPassword
      ? await client.query(
        `UPDATE users SET first_name=$1,last_name=$2,legal_name=$3,email=$4,phone=$5,gender=$6,username=$7,preferred_language=$8,password_hash=$9,updated_at=NOW()
         WHERE id=$10 RETURNING id,first_name,last_name,legal_name,email,username,preferred_language,role`,
        [values.firstName, values.lastName, values.legalName, values.email, values.phone, values.gender, values.username, values.preferredLanguage, await bcrypt.hash(values.newPassword, 12), req.user.sub],
      )
      : await client.query(
        `UPDATE users SET first_name=$1,last_name=$2,legal_name=$3,email=$4,phone=$5,gender=$6,username=$7,preferred_language=$8,updated_at=NOW()
         WHERE id=$9 RETURNING id,first_name,last_name,legal_name,email,username,preferred_language,role`,
        [values.firstName, values.lastName, values.legalName, values.email, values.phone, values.gender, values.username, values.preferredLanguage, req.user.sub],
      )
    await client.query(
      `INSERT INTO procurement_profiles (user_id,organization_name,department,job_title,profile_photo_path)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id) DO UPDATE SET organization_name=EXCLUDED.organization_name,department=EXCLUDED.department,job_title=EXCLUDED.job_title,profile_photo_path=EXCLUDED.profile_photo_path,updated_at=NOW()`,
      [req.user.sub, values.organizationName, values.department || null, values.jobTitle || null, photoPath],
    )
    await client.query('COMMIT')
    if (req.file && oldPhoto) removeFile(oldPhoto)
    const user = updateUser.rows[0]
    res.json({ message: 'Profile updated.', profile: { id: user.id, firstName: user.first_name, lastName: user.last_name, legalName: user.legal_name, email: user.email, phone: values.phone, gender: values.gender, username: user.username, preferredLanguage: user.preferred_language, role: user.role, organizationName: values.organizationName, department: values.department, jobTitle: values.jobTitle, profilePhotoUrl: photoPath } })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    removeFile(fileUrl(req.file))
    if (error.code === '23505') return res.status(409).json({ error: error.constraint?.includes('email') ? 'That email address is already in use.' : 'That username is already in use.' })
    console.error('Could not update procurement profile:', error.message)
    res.status(500).json({ error: 'Could not update your profile.' })
  } finally {
    client.release()
  }
})

router.get('/auctions', async (req, res) => {
  try {
    await pool.query("UPDATE auction_items SET status='closed', updated_at=NOW() WHERE created_by=$1 AND status='published' AND ends_at <= NOW()", [req.user.sub])
    const { rows } = await pool.query('SELECT * FROM auction_items WHERE created_by = $1 ORDER BY created_at DESC', [req.user.sub])
    res.json({ items: rows.map(publicItem) })
  } catch (error) {
    console.error('Could not load procurement auctions:', error.message)
    res.status(500).json({ error: 'Could not load auction items. Apply database/schema.sql first.' })
  }
})

router.post('/auctions', uploadsMiddleware, async (req, res) => {
  const item = valuesFromBody(req.body)
  const invalid = validate(item)
  if (invalid) {
    removeFile(fileUrl(req.files?.photo?.[0])); removeFile(fileUrl(req.files?.document?.[0]))
    return res.status(400).json({ error: invalid })
  }
  const photo = req.files?.photo?.[0]
  const document = req.files?.document?.[0]
  try {
    const { rows } = await pool.query(
      `INSERT INTO auction_items (title, description, vehicle_type, lot_number, initial_price, minimum_increment, maximum_price, starts_at, ends_at, status, photo_path, document_path, document_name, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [item.title, item.description, item.vehicleType, item.lotNumber, item.initialPrice, item.minimumIncrement, item.maximumPrice, item.startsAt, item.endsAt, item.status, fileUrl(photo), fileUrl(document), document?.originalname || null, req.user.sub],
    )
    res.status(201).json({ item: publicItem(rows[0]) })
  } catch (error) {
    removeFile(fileUrl(photo)); removeFile(fileUrl(document))
    if (error.code === '23505') return res.status(409).json({ error: 'That lot number is already in use.' })
    console.error('Could not create auction item:', error.message)
    res.status(500).json({ error: 'Could not save auction item.' })
  }
})

router.put('/auctions/:id', uploadsMiddleware, async (req, res) => {
  const item = valuesFromBody(req.body)
  const invalid = validate(item)
  if (invalid) {
    removeFile(fileUrl(req.files?.photo?.[0])); removeFile(fileUrl(req.files?.document?.[0]))
    return res.status(400).json({ error: invalid })
  }
  try {
    const previous = await pool.query('SELECT * FROM auction_items WHERE id = $1 AND created_by = $2', [req.params.id, req.user.sub])
    if (!previous.rowCount) {
      removeFile(fileUrl(req.files?.photo?.[0])); removeFile(fileUrl(req.files?.document?.[0]))
      return res.status(404).json({ error: 'Auction item not found or not owned by this procurement account.' })
    }
    const old = previous.rows[0]
    const photo = req.files?.photo?.[0]
    const document = req.files?.document?.[0]
    const nextPhoto = fileUrl(photo) || old.photo_path
    const nextDocument = fileUrl(document) || old.document_path
    const nextDocumentName = document?.originalname || old.document_name
    const { rows } = await pool.query(
      `UPDATE auction_items SET title=$1, description=$2, vehicle_type=$3, lot_number=$4, initial_price=$5, minimum_increment=$6, maximum_price=$7, starts_at=$8, ends_at=$9, status=$10, photo_path=$11, document_path=$12, document_name=$13, updated_at=NOW()
       WHERE id=$14 AND created_by=$15 RETURNING *`,
      [item.title, item.description, item.vehicleType, item.lotNumber, item.initialPrice, item.minimumIncrement, item.maximumPrice, item.startsAt, item.endsAt, item.status, nextPhoto, nextDocument, nextDocumentName, req.params.id, req.user.sub],
    )
    if (photo) removeFile(old.photo_path)
    if (document) removeFile(old.document_path)
    res.json({ item: publicItem(rows[0]) })
  } catch (error) {
    removeFile(fileUrl(req.files?.photo?.[0])); removeFile(fileUrl(req.files?.document?.[0]))
    if (error.code === '23505') return res.status(409).json({ error: 'That lot number is already in use.' })
    console.error('Could not update auction item:', error.message)
    res.status(500).json({ error: 'Could not update auction item.' })
  }
})

router.delete('/auctions/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM auction_items WHERE id=$1 AND created_by=$2 RETURNING photo_path, document_path', [req.params.id, req.user.sub])
    if (!rows.length) return res.status(404).json({ error: 'Auction item not found or not owned by this procurement account.' })
    removeFile(rows[0].photo_path); removeFile(rows[0].document_path)
    res.json({ message: 'Auction item deleted.' })
  } catch (error) {
    console.error('Could not delete auction item:', error.message)
    res.status(500).json({ error: 'Could not delete auction item.' })
  }
})

export default router
