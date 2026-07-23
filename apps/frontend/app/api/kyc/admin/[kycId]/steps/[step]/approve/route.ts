import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ kycId: string; step: string }> }
) {
  const { kycId, step } = await params
  const response = await backendFetch(
    `/api/v1/kyc/admin/${kycId}/steps/${step}/approve`,
    { method: "POST" }
  )
  return forwardResponse(response)
}