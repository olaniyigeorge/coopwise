import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cooperative_id: string }> }
) {
  const { cooperative_id } = await params
  const response = await backendFetch(
    `/api/v1/memberships/invite?group_id=${cooperative_id}`
  )
  return forwardResponse(response)
}
