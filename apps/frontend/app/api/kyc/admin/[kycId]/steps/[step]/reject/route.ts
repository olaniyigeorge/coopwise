import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kycId: string; step: string }> }
) {
  const { kycId, step } = await params
  const body = await request.text()

  const response = await backendFetch(
    `/api/v1/kyc/admin/${kycId}/steps/${step}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }
  )
  return forwardResponse(response)
}