import { NextRequest, NextResponse } from "next/server";
import { getItemsIndex, getItemsByMod } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "60");
    const mod = request.nextUrl.searchParams.get("mod") || "";
    const version = request.nextUrl.searchParams.get("version") || undefined;

    console.log("API call:", { page, limit, mod, version });

    let items: { id: string; displayName: string; modId?: string }[];

    if (mod) {
      const byMod = getItemsByMod(version);
      items = (byMod[mod] || []).map((i) => ({ ...i, modId: mod }));
    } else {
      items = getItemsIndex(version);
    }

    console.log("Items loaded:", items.length);

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return NextResponse.json(
      { data, total, page, totalPages },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load items",
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      },
      { status: 500 },
    );
  }
}
