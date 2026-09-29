import { backendFetch, forwardResponse } from "@/lib/server/backend"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ membership_id: string }> }
) {
  const { membership_id } = await params
  const body = await req.json()
  const response = await backendFetch(
    `/api/v1/memberships/applications/${membership_id}/decision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  return forwardResponse(response)
}
