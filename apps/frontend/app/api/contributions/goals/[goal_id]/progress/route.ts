import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ goal_id: string }> }
) {
  const { goal_id } = await params
  const response = await backendFetch(`/api/v1/contributions/goals/${goal_id}/progress`)
  return forwardResponse(response)
}
