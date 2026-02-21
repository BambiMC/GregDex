import { NextRequest, NextResponse } from "next/server";
import { getMaterials } from "@/lib/data";

export async function GET(request: NextRequest) {
  const sort = request.nextUrl.searchParams.get("sort") || "localizedName";
  const dir = request.nextUrl.searchParams.get("dir") || "asc";
  const q = request.nextUrl.searchParams.get("q") || "";

  let materials = getMaterials();

  // Filter
  if (q) {
    const query = q.toLowerCase();
    materials = materials.filter(
      (m: any) =>
        m.localizedName?.toLowerCase().includes(query) ||
        m.name?.toLowerCase().includes(query) ||
        m.chemicalFormula?.toLowerCase().includes(query)
    );
  }

  // Sort
  materials = [...materials].sort((a: any, b: any) => {
    const aVal = a[sort] ?? "";
    const bVal = b[sort] ?? "";
    if (typeof aVal === "string")
      return dir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    return dir === "asc" ? aVal - bVal : bVal - aVal;
  });

  return NextResponse.json(
    { materials },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
