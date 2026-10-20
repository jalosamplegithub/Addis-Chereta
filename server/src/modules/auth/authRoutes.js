import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../../config/db.js'
import authenticate from '../../middleware/auth.js'
import authorize from '../../middleware/authorize.js'

const router = Router()
const supportedLanguages = new Set(['en', 'am', 'om'])
const allowedGenders = new Set(['male', 'female', 'prefer_not_to_say'])

router.get('/me', authenticate, authorize('bidder'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,first_name,last_name,legal_name,email,phone,gender,username,preferred_language,created_at
       FROM users WHERE id=$1 AND role='bidder' AND is_active=TRUE`,
      [req.user.sub],
    )
    if (!rows.length) return res.status(404).json({ error: 'Your bidder profile was not found.' })
    const row = rows[0]
    res.json({ profile: { id: row.id, firstName: row.first_name, lastName: row.last_name, legalName: row.legal_name, email: row.email, phone: row.phone, gender: row.gender, username: row.username, preferredLanguage: row.preferred_language, createdAt: row.created_at } })
  } catch (error) {
    console.error('Could not load bidder profile:', error.message)
    res.status(500).json({ error: 'Could not load your profile.' })
  }
})

router.put('/me', authenticate, authorize('bidder'), async (req, res) => {
  const values = {
    firstName: String(req.body?.firstName ?? '').trim(),
    lastName: String(req.body?.lastName ?? '').trim(),
    legalName: String(req.body?.legalName ?? '').trim(),
    email: String(req.body?.email ?? '').trim().toLowerCase(),
    phone: String(req.body?.phone ?? '').trim(),
    gender: String(req.body?.gender ?? ''),
    username: String(req.body?.username ?? '').trim(),
    preferredLanguage: String(req.body?.preferredLanguage ?? 'en'),
  }
  if (!values.firstName || values.firstName.length > 80 || !values.lastName || values.lastName.length > 80 || !values.legalName || values.legalName.length > 180) return res.status(400).json({ error: 'Enter your first name, last name, and legal name.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (!/^[+\d][\d\s().-]{5,29}$/.test(values.phone)) return res.status(400).json({ error: 'Enter a valid phone number.' })
  if (!allowedGenders.has(values.gender)) return res.status(400).json({ error: 'Choose a valid gender option.' })
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(values.username)) return res.status(400).json({ error: 'Username must be 3–50 characters and use letters, numbers, dots, underscores, or hyphens.' })
  if (!supportedLanguages.has(values.preferredLanguage)) return res.status(400).json({ error: 'Choose a supported language.' })

  try {
    const { rows } = await pool.query(
      `UPDATE users SET first_name=$1,last_name=$2,legal_name=$3,email=$4,phone=$5,gender=$6,username=$7,preferred_language=$8,updated_at=NOW()
       WHERE id=$9 AND role='bidder' AND is_active=TRUE
       RETURNING id,first_name,last_name,legal_name,email,phone,gender,username,preferred_language,created_at`,
      [values.firstName, values.lastName, values.legalName, values.email, values.phone, values.gender, values.username, values.preferredLanguage, req.user.sub],
    )
    if (!rows.length) return res.status(404).json({ error: 'Your bidder profile was not found.' })
    const row = rows[0]
    res.json({ message: 'Profile updated.', profile: { id: row.id, firstName: row.first_name, lastName: row.last_name, legalName: row.legal_name, email: row.email, phone: row.phone, gender: row.gender, username: row.username, preferredLanguage: row.preferred_language, createdAt: row.created_at } })
  } catch (error) {
    if (error.code === '23505') {
      const field = error.constraint?.includes('email') ? 'email address' : 'username'
      return res.status(409).json({ error: `Another account already uses that ${field}.` })
    }
    console.error('Could not update bidder profile:', error.message)
    res.status(500).json({ error: 'Could not update your profile.' })
  }
})

router.put('/me/password', authenticate, authorize('bidder'), async (req, res) => {
  const currentPassword = req.body?.currentPassword
  const newPassword = req.body?.newPassword
  if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || newPassword.length < 6 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    return res.status(400).json({ error: 'Enter your current password and a new password of at least 6 characters.' })
  }
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1 AND role=\'bidder\' AND is_active=TRUE', [req.user.sub])
    if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) return res.status(401).json({ error: 'Your current password is incorrect.' })
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await pool.query('UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2 AND role=\'bidder\'', [passwordHash, req.user.sub])
    res.json({ message: 'Your password has been changed.' })
  } catch (error) {
    console.error('Could not change bidder password:', error.message)
    res.status(500).json({ error: 'Could not change your password.' })
  }
})

router.delete('/me', authenticate, authorize('bidder'), async (req, res) => {
  const password = req.body?.password
  if (typeof password !== 'string' || !password) return res.status(400).json({ error: 'Enter your password to delete your account.' })
  try {
    const { rows } = await pool.query('SELECT id,password_hash FROM users WHERE id=$1 AND role=\'bidder\' AND is_active=TRUE', [req.user.sub])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Your password is incorrect.' })
    await pool.query('DELETE FROM users WHERE id=$1 AND role=\'bidder\'', [user.id])
    res.json({ message: 'Your account and submitted bids have been deleted.' })
  } catch (error) {
    console.error('Could not delete bidder account:', error.message)
    res.status(500).json({ error: 'Could not delete your account. Please contact support.' })
  }
})

router.post('/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = req.body?.password

  if (!username || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Enter your username and password.' })
  }
  if (username.length > 50 || password.length > 72) {
    return res.status(400).json({ error: 'Username or password is invalid.' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('Sign-in unavailable: JWT_SECRET is not configured.')
    return res.status(503).json({ error: 'Sign-in is temporarily unavailable. Please contact support.' })
  }

  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, legal_name, email, username, password_hash,
              preferred_language, role, is_active
       FROM users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [username],
    )
    const user = result.rows[0]

    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Incorrect username or password.' })
    }

    const token = jwt.sign(
      { sub: String(user.id), role: user.role, username: user.username },
      secret,
      { expiresIn: '8h', issuer: 'addis-chereta-api' },
    )

    return res.json({
      message: 'Sign-in successful.',
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        legalName: user.legal_name,
        email: user.email,
        username: user.username,
        preferredLanguage: user.preferred_language,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Account sign-in failed:', error.code || 'unknown', error.message)
    return res.status(500).json({ error: 'We could not sign you in. Please try again.' })
  }
})

router.post('/register', async (req, res) => {
  const {
    firstName,
    lastName,
    legalName,
    email,
    phone,
    gender,
    username,
    password,
    preferredLanguage = 'en',
  } = req.body ?? {}

  const user = {
    firstName: String(firstName ?? '').trim(),
    lastName: String(lastName ?? '').trim(),
    legalName: String(legalName ?? '').trim(),
    email: String(email ?? '').trim().toLowerCase(),
    phone: String(phone ?? '').trim(),
    gender: String(gender ?? ''),
    username: String(username ?? '').trim(),
    preferredLanguage: String(preferredLanguage ?? 'en'),
  }

  if (Object.values(user).some((value) => !value)) {
    return res.status(400).json({ error: 'Please complete all registration fields.' })
  }
  if (user.firstName.length > 80 || user.lastName.length > 80 || user.legalName.length > 180) {
    return res.status(400).json({ error: 'Please check the length of your name or legal name.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) || user.email.length > 254) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (user.phone.length > 30 || !/^[+\d][\d\s().-]{5,29}$/.test(user.phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number.' })
  }
  if (!allowedGenders.has(user.gender)) {
    return res.status(400).json({ error: 'Choose a valid gender option.' })
  }
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(user.username)) {
    return res.status(400).json({ error: 'Username must be 3–50 characters and use letters, numbers, dots, underscores or hyphens.' })
  }
  if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Password must be at least 6 characters and no more than 72 UTF-8 bytes.' })
  }
  if (!supportedLanguages.has(user.preferredLanguage)) {
    return res.status(400).json({ error: 'Choose a supported language.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      `INSERT INTO users
        (first_name, last_name, legal_name, email, phone, gender, username, password_hash, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, first_name, last_name, legal_name, email, phone, gender, username, preferred_language, role, created_at`,
      [
        user.firstName,
        user.lastName,
        user.legalName,
        user.email,
        user.phone,
        user.gender,
        user.username,
        passwordHash,
        user.preferredLanguage,
      ],
    )

    return res.status(201).json({ message: 'Your account has been created.', user: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') {
      const field = error.constraint?.includes('email') ? 'email address' : 'username'
      return res.status(409).json({ error: `An account with this ${field} already exists.` })
    }
    console.error('Account registration failed:', error.code || 'unknown', error.message)
    return res.status(500).json({ error: 'We could not create your account. Please try again.' })
  }
})

export default router
