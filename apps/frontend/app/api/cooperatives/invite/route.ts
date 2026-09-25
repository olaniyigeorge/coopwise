import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const inviteCode = searchParams.get("invite_code")
  const response = await backendFetch(
    `/api/v1/memberships/invite?invite_code=${encodeURIComponent(inviteCode ?? "")}`
  )
  return forwardResponse(response)
}
