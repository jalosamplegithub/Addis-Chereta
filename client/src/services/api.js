const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  const token = window.localStorage.getItem('addis-chereta-token')
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  let response
  try {
    response = await fetch(`${apiBase}${path}`, { ...options, headers })
  } catch {
    throw new Error('Cannot reach the service. Check that the server is running and try again.')
  }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.')
  return result
}
