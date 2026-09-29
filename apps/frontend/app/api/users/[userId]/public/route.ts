import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const response = await backendFetch(`/api/v1/users/${userId}/public`)
  return forwardResponse(response)
}
