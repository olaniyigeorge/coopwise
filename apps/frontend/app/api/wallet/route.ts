import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET() {
  const response = await backendFetch("/api/v1/wallet/get-wallet")
  return forwardResponse(response)
}
