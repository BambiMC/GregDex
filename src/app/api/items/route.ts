import { NextRequest, NextResponse } from "next/server";
import { getItemsIndex, getItemsByMod } from "@/lib/data";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "60");
  const mod = request.nextUrl.searchParams.get("mod") || "";

  let items: { id: string; displayName: string; modId?: string }[];

  if (mod) {
    const byMod = getItemsByMod();
    items = (byMod[mod] || []).map((i) => ({ ...i, modId: mod }));
  } else {
    items = getItemsIndex();
  }

  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return NextResponse.json(
    { data, total, page, totalPages },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
