import jwt from 'jsonwebtoken'

export default function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Sign in is required.' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'addis-chereta-api' })
    next()
  } catch {
    return res.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' })
  }
}
