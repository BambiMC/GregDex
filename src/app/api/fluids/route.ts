import { NextRequest, NextResponse } from "next/server";
import { getFluidsIndex } from "@/lib/data";

export async function GET(request: NextRequest) {
  const version = request.nextUrl.searchParams.get("version") || undefined;

  try {
    const fluids = getFluidsIndex(version);

    return NextResponse.json(fluids, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load fluids" },
      { status: 500 }
    );
  }
}
