import { backendFetch, forwardResponse } from '@/lib/server/backend'

export async function POST(request: Request) {
  const response = await backendFetch('/api/v1/kyc/banks/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await request.json()),
  })
  return forwardResponse(response)
}
