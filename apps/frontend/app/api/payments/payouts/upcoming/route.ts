import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET() {
  const response = await backendFetch("/api/v1/payments/payouts/upcoming")
  return forwardResponse(response)
}
