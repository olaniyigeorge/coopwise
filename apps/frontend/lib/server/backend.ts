import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const API_URL = process.env.BACKEND_URL!

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