import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { detail: "Auto-pay is not wired to the backend yet." },
    { status: 501 }
  );
}
