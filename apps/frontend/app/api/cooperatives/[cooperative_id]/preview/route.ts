import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cooperative_id: string }> }
) {
  const { cooperative_id } = await params
  const response = await backendFetch(
    `/api/v1/cooperatives/${cooperative_id}/preview`
  )
  return forwardResponse(response)
}
