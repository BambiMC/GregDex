import { NextRequest, NextResponse } from "next/server";
import { getMachines } from "@/lib/data";

export async function GET(request: NextRequest) {
  const version = request.nextUrl.searchParams.get("version") || undefined;
  const machines = getMachines(version);
  return NextResponse.json(
    { machines },
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
