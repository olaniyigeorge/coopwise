import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const response = await backendFetch(`/api/v1/contributions/${id}`)
  return forwardResponse(response)
}
