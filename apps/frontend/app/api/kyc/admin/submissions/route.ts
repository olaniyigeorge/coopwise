import { NextRequest } from "next/server"
import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.search
  const response = await backendFetch(`/api/v1/kyc/admin/submissions${qs}`)
  return forwardResponse(response)
}