import { NextRequest, NextResponse } from "next/server"
import { backendFetch } from "@/lib/server/backend"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  const body = await req.json()

  // const resourceOwnerId = body.resource_owner_id ?? userId
  //?resource_owner_id=${resourceOwnerId}
  const backendRes = await backendFetch(
    `/api/v1/users/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )

  const text = await backendRes.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { detail: text || "Invalid response from server" }
  }

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status })
  }

  return NextResponse.json(data)
}