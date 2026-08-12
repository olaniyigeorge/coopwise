import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cooperative_id: string }> }
) {
  const { cooperative_id } = await params
  const response = await backendFetch(
    `/api/v1/cooperatives/${cooperative_id}/activate`,
    { method: "POST" }
  )
  return forwardResponse(response)
}