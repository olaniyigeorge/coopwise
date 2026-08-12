import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(req: Request, { params }: { params: Promise<{ cooperative_id: string }> }) {
  const { cooperative_id } = await params
  const body = await req.json()
  const response = await backendFetch(`/api/v1/cooperatives/${cooperative_id}/rules/membership`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return forwardResponse(response)
}