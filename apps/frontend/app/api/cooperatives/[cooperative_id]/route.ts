import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cooperative_id: string }> }
) {
  const { cooperative_id } = await params
  const response = await backendFetch(`/api/v1/cooperatives/${cooperative_id}`)
  return forwardResponse(response)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ cooperative_id: string }> }
) {
  const { cooperative_id } = await params
  const body = await req.json()
  const response = await backendFetch(`/api/v1/cooperatives/${cooperative_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return forwardResponse(response)
}