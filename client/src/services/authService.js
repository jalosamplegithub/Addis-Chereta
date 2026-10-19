const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function login({ username, password }) {
  let response
  try {
    response = await fetch(`${apiBase.replace(/\/$/, '')}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new Error('Cannot reach the sign-in service. Check that the server is running and try again.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result.error || 'Sign-in failed. Please try again.')
  }

  window.localStorage.setItem('addis-chereta-token', result.token)
  window.localStorage.setItem('addis-chereta-user', JSON.stringify(result.user))
  return result.user
}
