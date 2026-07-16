import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server/backend"

export async function POST() {
  const response = await backendFetch("/api/v1/kyc/start", {
    method: "POST",
  })

  const data = await response.json()

  return NextResponse.json(data, {
    status: response.status,
  })
}