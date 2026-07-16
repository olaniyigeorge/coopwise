import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server/backend"

export async function POST(req: Request) {
  const body = await req.json()

  const response = await backendFetch("/api/v1/kyc/banking-info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }
  
  const data = await response.json()

  return NextResponse.json(data, {
    status: response.status,
  })
}