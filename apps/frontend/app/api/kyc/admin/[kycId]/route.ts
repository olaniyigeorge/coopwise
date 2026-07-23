import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kycId: string }> }
) {
  const { kycId } = await params
  const response = await backendFetch(`/api/v1/kyc/admin/${kycId}`)
  return forwardResponse(response)
}