import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET() {
  const response = await backendFetch("/api/v1/wallet/withdrawals")
  return forwardResponse(response)
}
