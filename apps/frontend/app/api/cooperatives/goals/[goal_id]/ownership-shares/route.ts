import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(req: Request, { params }: { params: Promise<{ goal_id: string }> }) {
  const { goal_id } = await params
  const body = await req.json()
  const response = await backendFetch(`/api/v1/cooperatives/goals/${goal_id}/ownership-shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return forwardResponse(response)
}

export async function GET(req: Request, { params }: { params: Promise<{ goal_id: string }> }) {
  const { goal_id } = await params
  const response = await backendFetch(`/api/v1/cooperatives/goals/${goal_id}/ownership-shares`)
  return forwardResponse(response)
}