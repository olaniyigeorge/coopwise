import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(req: Request) {
  const body = await req.json()

    console.log(`\n[Cooperative Create] with payload ${body}\n`)
  const response = await backendFetch("/api/v1/cooperatives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return forwardResponse(response)
}

export async function GET(req: Request) {
  // const { search } = new URL(req.url)
  const response = await backendFetch(`/api/v1/cooperatives`) // ${search}
  return forwardResponse(response)
}