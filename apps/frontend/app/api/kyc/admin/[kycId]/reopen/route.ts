import { backendFetch, forwardResponse } from '@/lib/server/backend'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kycId: string }> }
) {
  const { kycId } = await params
  const response = await backendFetch(`/api/v1/kyc/admin/${kycId}/reopen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await request.json()),
  })
  return forwardResponse(response)
}
