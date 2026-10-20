import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../../config/db.js'
import authenticate from '../../middleware/auth.js'
import authorize from '../../middleware/authorize.js'

const router = Router()
const assignableRoles = new Set(['bidder', 'procurement', 'finance', 'evaluator', 'auditor', 'admin'])
const publicUserFields = `id, first_name, last_name, legal_name, email, phone, username, role, is_active, created_at, updated_at`

router.use(authenticate, authorize('admin'))

router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${publicUserFields} FROM users ORDER BY created_at DESC, id DESC`,
    )
    const counts = rows.reduce((result, user) => {
      result.total += 1
      if (user.is_active) result.active += 1
      result.roles[user.role] = (result.roles[user.role] || 0) + 1
      return result
    }, { total: 0, active: 0, roles: {} })
    res.json({ users: rows, counts })
  } catch (error) {
    console.error('Could not load admin users:', error.message)
    res.status(500).json({ error: 'Could not load user accounts.' })
  }
})

router.get('/tenders', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id,a.title,a.listing_intent,a.vehicle_type,a.lot_number,a.status,a.photo_path,
              a.initial_price,a.maximum_price,a.starts_at,a.ends_at,a.created_at,
              u.username AS procurement_username,
              COALESCE(p.organization_name,u.legal_name) AS organization_name,
              COUNT(b.id)::int AS bid_count,
              COALESCE(
                jsonb_agg(jsonb_build_object(
                  'username',b.bidder_username,
                  'email',b.bidder_email,
                  'submittedAt',b.created_at
                ) ORDER BY b.created_at DESC) FILTER (WHERE b.id IS NOT NULL),
                '[]'::jsonb
              ) AS bidders,
              COALESCE(participation.participants,'[]'::jsonb) AS participants
       FROM auction_items a
       JOIN users u ON u.id=a.created_by
       LEFT JOIN procurement_profiles p ON p.user_id=u.id
       LEFT JOIN auction_bids b ON b.auction_item_id=a.id
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
           'username',bidder.username,
           'email',bidder.email,
           'hasBid',(submitted.id IS NOT NULL),
           'isActive',bidder.is_active,
           'submittedAt',submitted.created_at
         ) ORDER BY (submitted.id IS NOT NULL) DESC,bidder.username) AS participants
         FROM users bidder
         LEFT JOIN auction_bids submitted ON submitted.auction_item_id=a.id AND submitted.bidder_id=bidder.id
         WHERE bidder.role='bidder'
       ) participation ON TRUE
       GROUP BY a.id,u.id,p.user_id,participation.participants
       ORDER BY a.created_at DESC,a.id DESC`,
    )
    const tenders = rows.map((row) => ({ ...row, hasBids: row.bid_count > 0 }))
    res.json({ tenders, counts: {
      total: tenders.length,
      withBids: tenders.filter((tender) => tender.hasBids).length,
      withoutBids: tenders.filter((tender) => !tender.hasBids).length,
    } })
  } catch (error) {
    console.error('Could not load admin tenders:', error.message)
    res.status(500).json({ error: 'Could not load tender and bid activity.' })
  }
})

router.post('/users', async (req, res) => {
  const body = req.body || {}
  const user = {
    firstName: String(body.firstName ?? '').trim(),
    lastName: String(body.lastName ?? '').trim(),
    legalName: String(body.legalName ?? '').trim(),
    email: String(body.email ?? '').trim().toLowerCase(),
    phone: String(body.phone ?? '').trim(),
    gender: String(body.gender ?? ''),
    username: String(body.username ?? '').trim(),
    password: body.password,
    preferredLanguage: String(body.preferredLanguage ?? 'en'),
    role: String(body.role ?? 'bidder'),
    organizationName: String(body.organizationName ?? '').trim(),
  }
  if (!user.firstName || user.firstName.length > 80 || !user.lastName || user.lastName.length > 80 || !user.legalName || user.legalName.length > 180) return res.status(400).json({ error: 'Enter a first name, last name, and organization or legal name.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) || user.email.length > 254 || !/^[+\d][\d\s().-]{5,29}$/.test(user.phone)) return res.status(400).json({ error: 'Enter a valid email address and phone number.' })
  if (!['male', 'female', 'prefer_not_to_say'].includes(user.gender)) return res.status(400).json({ error: 'Choose a valid gender option.' })
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(user.username)) return res.status(400).json({ error: 'Username must be 3–50 characters and use letters, numbers, dots, underscores, or hyphens.' })
  if (typeof user.password !== 'string' || user.password.length < 6 || Buffer.byteLength(user.password, 'utf8') > 72) return res.status(400).json({ error: 'Password must be at least 6 characters and no more than 72 UTF-8 bytes.' })
  if (!['en', 'am', 'om'].includes(user.preferredLanguage) || !assignableRoles.has(user.role)) return res.status(400).json({ error: 'Choose a supported language and account role.' })
  if (user.organizationName.length > 180) return res.status(400).json({ error: 'Organization name must be 180 characters or fewer.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const passwordHash = await bcrypt.hash(user.password, 12)
    const { rows } = await client.query(
      `INSERT INTO users (first_name,last_name,legal_name,email,phone,gender,username,password_hash,preferred_language,role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${publicUserFields}`,
      [user.firstName, user.lastName, user.legalName, user.email, user.phone, user.gender, user.username, passwordHash, user.preferredLanguage, user.role],
    )
    if (user.role === 'procurement') {
      await client.query(
        `INSERT INTO procurement_profiles (user_id,organization_name,department,job_title) VALUES ($1,$2,'Procurement','Procurement Officer')`,
        [rows[0].id, user.organizationName || user.legalName],
      )
    }
    await client.query('COMMIT')
    res.status(201).json({ user: rows[0], message: 'Account created.' })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    if (error.code === '23505') return res.status(409).json({ error: error.constraint?.includes('email') ? 'That email address is already in use.' : 'That username is already in use.' })
    console.error('Could not create admin account:', error.message)
    res.status(500).json({ error: 'Could not create the account.' })
  } finally {
    client.release()
  }
})

router.patch('/users/:id', async (req, res) => {
  const id = String(req.params.id)
  const { firstName, lastName, legalName, email, phone, username, role } = req.body || {}
  const values = {
    firstName: String(firstName ?? '').trim(),
    lastName: String(lastName ?? '').trim(),
    legalName: String(legalName ?? '').trim(),
    email: String(email ?? '').trim().toLowerCase(),
    phone: String(phone ?? '').trim(),
    username: String(username ?? '').trim(),
    role: String(role ?? ''),
  }
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid user account.' })
  if (!values.firstName || values.firstName.length > 80 || !values.lastName || values.lastName.length > 80 || !values.legalName || values.legalName.length > 180) return res.status(400).json({ error: 'Enter a first name, last name, and legal name.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254 || !/^[+\d][\d\s().-]{5,29}$/.test(values.phone) || !/^[A-Za-z0-9._-]{3,50}$/.test(values.username)) return res.status(400).json({ error: 'Check the email, phone number, and username.' })
  if (!assignableRoles.has(values.role)) return res.status(400).json({ error: 'Choose a supported account role.' })
  if (String(req.user.sub) === id && values.role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own administrator role.' })

  try {
    if (values.role !== 'admin') {
      const current = await pool.query('SELECT role FROM users WHERE id=$1', [id])
      if (current.rows[0]?.role === 'admin') {
        const admins = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role='admin' AND is_active=TRUE")
        if (admins.rows[0].count <= 1) return res.status(400).json({ error: 'Keep at least one active administrator account.' })
      }
    }
    const { rows } = await pool.query(
      `UPDATE users SET first_name=$1,last_name=$2,legal_name=$3,email=$4,phone=$5,username=$6,role=$7,updated_at=NOW()
       WHERE id=$8 RETURNING ${publicUserFields}`,
      [values.firstName, values.lastName, values.legalName, values.email, values.phone, values.username, values.role, id],
    )
    if (!rows.length) return res.status(404).json({ error: 'User account not found.' })
    res.json({ user: rows[0], message: 'User account updated.' })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: error.constraint?.includes('email') ? 'That email is already assigned to another account.' : 'That username is already assigned to another account.' })
    console.error('Could not update admin user:', error.message)
    res.status(500).json({ error: 'Could not update the user account.' })
  }
})

// Account deletion is a reversible deactivation so procurement and bid history stay intact.
router.delete('/users/:id', async (req, res) => {
  const id = String(req.params.id)
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid user account.' })
  if (String(req.user.sub) === id) return res.status(400).json({ error: 'You cannot deactivate your own administrator account.' })
  try {
    const current = await pool.query('SELECT role FROM users WHERE id=$1 AND is_active=TRUE', [id])
    if (current.rows[0]?.role === 'admin') {
      const admins = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role='admin' AND is_active=TRUE")
      if (admins.rows[0].count <= 1) return res.status(400).json({ error: 'Keep at least one active administrator account.' })
    }
    const { rows } = await pool.query(
      `UPDATE users SET is_active=FALSE,updated_at=NOW() WHERE id=$1 AND is_active=TRUE RETURNING ${publicUserFields}`,
      [id],
    )
    if (!rows.length) return res.status(404).json({ error: 'Active user account not found.' })
    res.json({ user: rows[0], message: 'Account deactivated. Its procurement and bid history has been retained.' })
  } catch (error) {
    console.error('Could not deactivate admin user:', error.message)
    res.status(500).json({ error: 'Could not deactivate the user account.' })
  }
})

router.patch('/users/:id/activate', async (req, res) => {
  const id = String(req.params.id)
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid user account.' })
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_active=TRUE,updated_at=NOW() WHERE id=$1 AND is_active=FALSE RETURNING ${publicUserFields}`,
      [id],
    )
    if (!rows.length) return res.status(404).json({ error: 'Deactivated user account not found.' })
    res.json({ user: rows[0], message: 'Account reactivated.' })
  } catch (error) {
    console.error('Could not reactivate admin user:', error.message)
    res.status(500).json({ error: 'Could not reactivate the user account.' })
  }
})

export default router
