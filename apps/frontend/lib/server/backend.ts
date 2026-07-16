import { cookies } from "next/headers"

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