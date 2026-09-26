import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(req: Request) {
  const { search } = new URL(req.url)
  const response = await backendFetch(`/api/v1/wallet/deposit/finalise${search}`, {
    method: "POST",
  })
  return forwardResponse(response)
}
