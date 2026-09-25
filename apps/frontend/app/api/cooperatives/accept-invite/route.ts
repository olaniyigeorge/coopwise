import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(req: Request) {
  const { invite_code } = await req.json()
  const response = await backendFetch(
    `/api/v1/memberships/accept-invite?invite_code=${encodeURIComponent(invite_code ?? "")}`,
    { method: "POST" }
  )
  return forwardResponse(response)
}
