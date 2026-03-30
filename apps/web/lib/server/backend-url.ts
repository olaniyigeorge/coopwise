/**
 * Single source of truth for FastAPI base URL used by Next.js route handlers.
 * Prefer BACKEND_URL in server env; fall back to public API URL (Render/local).
 */
export function resolveBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://coopwise.onrender.com"
  );
}
