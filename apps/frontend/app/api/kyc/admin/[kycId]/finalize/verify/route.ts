import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ kycId: string }> }
) {
  const { kycId } = await params
  const response = await backendFetch(
    `/api/v1/kyc/admin/${kycId}/finalize/verify`,
    { method: "POST" }
  )
  return forwardResponse(response)
}