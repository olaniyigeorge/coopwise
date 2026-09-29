import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ group_id: string }> }
) {
  const { group_id } = await params
  const response = await backendFetch(
    `/api/v1/memberships/groups/${group_id}/applications`
  )
  return forwardResponse(response)
}
