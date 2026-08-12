import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET() {
  const response = await backendFetch("/api/v1/cooperatives/catalog/beneficiary-patterns")
  return forwardResponse(response)
}