export function getJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

export function isExpiredOrExpiringSoon(token: string, bufferMs = 10_000): boolean {
  const exp = getJwtExpiry(token)
  if (exp === null) return true // can't parse it, treat as unusable
  return Date.now() >= exp - bufferMs
}