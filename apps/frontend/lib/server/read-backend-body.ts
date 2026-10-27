import { NextResponse } from "next/server"

import { rateLimitMessage } from "@/lib/rate-limit-message"

export async function readBackendBody(response: Response): Promise<{
  data: Record<string, unknown>
  retryAfter: string | null
}> {
  const retryAfter = response.headers.get("Retry-After")
  const text = await response.text()
  let data: Record<string, unknown> = {}

  if (text) {
    try {
      const parsed = JSON.parse(text) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>
      } else {
        data = { detail: text }
      }
    } catch {
      data = { detail: text }
    }
  }

  if (response.status === 429) {
    data.detail = rateLimitMessage(data.detail, retryAfter)
  }

  return { data, retryAfter }
}

export function jsonWithRetry(
  data: Record<string, unknown>,
  status: number,
  retryAfter: string | null
) {
  const res = NextResponse.json(data, { status })
  if (retryAfter) res.headers.set("Retry-After", retryAfter)
  return res
}
