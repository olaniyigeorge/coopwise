import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(req: Request) {
  const body = await req.json()
  const response = await backendFetch("/api/v1/support/write-us", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return forwardResponse(response)
}
