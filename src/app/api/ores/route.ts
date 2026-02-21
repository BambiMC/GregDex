import { NextRequest, NextResponse } from "next/server";
import { getOreVeins, getSmallOres } from "@/lib/data";

export async function GET(request: NextRequest) {
  const dimension = request.nextUrl.searchParams.get("dimension") || "";

  let veins = getOreVeins();
  let smallOres = getSmallOres();

  if (dimension) {
    veins = veins.filter((v: any) => v.dimensions?.includes(dimension));
    smallOres = smallOres.filter((o: any) => o.dimensions?.includes(dimension));
  }

  return NextResponse.json(
    { veins, smallOres },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
