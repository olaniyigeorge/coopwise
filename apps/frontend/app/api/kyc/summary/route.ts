import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server/backend"

export async function GET() {
  const response = await backendFetch("/api/v1/kyc/summary")

  const data = await response.json()

  return NextResponse.json(data, {
    status: response.status,
  })
}