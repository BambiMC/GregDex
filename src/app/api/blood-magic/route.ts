import { NextResponse } from "next/server";
import { getBloodMagic } from "@/lib/data";

export async function GET() {
  const data = getBloodMagic();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
