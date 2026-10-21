import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ group_id: string }> }
) {
  const { group_id } = await params
  const response = await backendFetch(
    `/api/v1/payments/payouts/${group_id}/execute`,
    { method: "POST" }
  )
  return forwardResponse(response)
}
