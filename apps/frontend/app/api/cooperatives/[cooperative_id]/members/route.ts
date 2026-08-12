import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cooperative_id: string }> }
) {
  const { cooperative_id } = await params
  // const { search } = new URL(req.url)
  const response = await backendFetch(
    `/api/v1/cooperatives/${cooperative_id}/members` // ${search}
  )
  return forwardResponse(response)
}