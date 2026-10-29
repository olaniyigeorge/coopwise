import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(req: Request) {
  const response = await backendFetch("/api/v1/wallet/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await req.json()),
  })
  return forwardResponse(response)
}
