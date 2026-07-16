import { NextRequest, NextResponse } from "next/server"
import { backendFetch } from "@/lib/server/backend"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  // Forward the incoming multipart body as-is — do NOT set Content-Type
  // manually here, fetch will set the correct multipart boundary from the
  // FormData object itself.
  const formData = await req.formData()

  const backendRes = await backendFetch(
    `/api/v1/users/${userId}/avatar`, // confirm actual backend path
    {
      method: "PATCH",
      body: formData,
    }
  )

  const text = await backendRes.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { detail: text || "Invalid response from server" }
  }

  return NextResponse.json(data, { status: backendRes.status })
}