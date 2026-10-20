import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

export default async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Sign in is required.' })
  let claims
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'addis-chereta-api' })
  } catch {
    return res.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' })
  }
  try {
    const { rows } = await pool.query('SELECT id, username, role FROM users WHERE id=$1 AND is_active=TRUE', [claims.sub])
    if (!rows.length) return res.status(401).json({ error: 'This account is inactive. Contact an administrator.' })
    req.user = { ...claims, role: rows[0].role, username: rows[0].username }
    next()
  } catch (error) {
    console.error('Could not verify active user account:', error.message)
    return res.status(503).json({ error: 'Could not verify your account right now. Please try again.' })
  }
}
