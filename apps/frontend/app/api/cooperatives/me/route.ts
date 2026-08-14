import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function GET(req: Request) {
  const { search } = new URL(req.url)
   console.log(`Seraching for ${search}`)
  const response = await backendFetch(`/api/v1/cooperatives/me`) //${search}
  return forwardResponse(response)
}