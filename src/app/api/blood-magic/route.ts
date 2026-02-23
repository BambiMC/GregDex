import { NextRequest, NextResponse } from "next/server";
import { getBloodMagic } from "@/lib/data";

export async function GET(request: NextRequest) {
  const version = request.nextUrl.searchParams.get("version") || undefined;
  const data = getBloodMagic(version);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
