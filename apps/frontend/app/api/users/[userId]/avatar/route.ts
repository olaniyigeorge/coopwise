import { NextRequest, NextResponse } from "next/server"
import { backendFetch } from "@/lib/server/backend"

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Forward the incoming multipart body as-is — do NOT set Content-Type
  // manually here, fetch will set the correct multipart boundary from the
  // FormData object itself.
  const formData = await req.formData()

  const backendRes = await backendFetch(
    `/api/v1/users/${params.userId}/avatar`, // confirm actual backend path
    {
      method: "POST",
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