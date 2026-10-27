/** User-facing copy for an HTTP 429. Prefer the server's own detail. */
export function rateLimitMessage(
  detail: unknown,
  retryAfter: string | null
): string {
  if (typeof detail === "string") {
    const text = detail.trim()
    if (text && text !== "Too Many Requests") return text
  }

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) {
    const wait = Math.ceil(seconds)
    return wait === 1
      ? "Too many attempts. Try again in 1 second."
      : `Too many attempts. Try again in ${wait} seconds.`
  }

  return "Too many attempts. Please wait a moment and try again."
}
