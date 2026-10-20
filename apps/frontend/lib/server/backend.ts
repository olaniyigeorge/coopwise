import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"

const API_URL = process.env.BACKEND_URL!

/**
 * Vercel (and most proxies) put the end user's IP in `x-forwarded-for`.
 * The backend's rate limiter keys its token buckets by that header; if we
 * don't forward it, every request from this deployment arrives from the
 * same egress IP and shares one bucket across all users — which is what
 * produced the 429 storms on busy dashboard pages.
 */
type HeadersLike = { get(name: string): string | null }

export function clientIpHeadersFrom(req: { headers: HeadersLike }): Record<string, string> {
  const forwardedFor = req.headers.get("x-forwarded-for")
  const realIp = req.headers.get("x-real-ip")

  return {
    ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
    ...(realIp ? { "X-Real-IP": realIp } : {}),
  }
}

async function clientIpHeaders(): Promise<Record<string, string>> {
  return clientIpHeadersFrom({ headers: await headers() })
}

export async function backendFetch(
  path: string,
  init?: RequestInit,
) {
  const cookieStore = await cookies()

  const token = cookieStore.get("auth_token")?.value

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(await clientIpHeaders()),
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    },
  })
}


// New: turns a backend Response into a NextResponse, preserving
// status code and body shape (including FastAPI's 204s).
export async function forwardResponse(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  return NextResponse.json(body, { status: response.status })
}