import { backendFetch, forwardResponse } from "@/lib/server/backend"

type Params = { params: Promise<{ goal_id: string; share_id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { goal_id, share_id } = await params
  const body = await req.json()
  const response = await backendFetch(
    `/api/v1/cooperatives/goals/${goal_id}/ownership-shares/${share_id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  return forwardResponse(response)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { goal_id, share_id } = await params
  const response = await backendFetch(
    `/api/v1/cooperatives/goals/${goal_id}/ownership-shares/${share_id}`,
    { method: "DELETE" }
  )
  return forwardResponse(response)
}
