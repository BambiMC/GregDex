import { NextRequest, NextResponse } from "next/server";
import { getFluidsIndex } from "@/lib/data";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "60");
  const version = request.nextUrl.searchParams.get("version") || undefined;

  try {
    const fluids = getFluidsIndex(version);
    const total = fluids.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = fluids.slice(start, start + limit);

    return NextResponse.json(
      { data, total, page, totalPages },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load fluids" },
      { status: 500 },
    );
  }
}
