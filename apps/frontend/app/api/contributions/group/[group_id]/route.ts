import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ group_id: string }> }
) {
  const { group_id } = await params
  const { search } = new URL(req.url)
  const response = await backendFetch(`/api/v1/contributions/group/${group_id}${search}`)
  return forwardResponse(response)
}
