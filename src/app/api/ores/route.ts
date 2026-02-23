import { NextRequest, NextResponse } from "next/server";
import { getOreVeins, getSmallOres } from "@/lib/data";

export async function GET(request: NextRequest) {
  const dimension = request.nextUrl.searchParams.get("dimension") || "";
  const version = request.nextUrl.searchParams.get("version") || undefined;

  let veins = getOreVeins(version);
  let smallOres = getSmallOres(version);

  if (dimension) {
    veins = veins.filter((v: any) => v.dimensions?.includes(dimension));
    smallOres = smallOres.filter((o: any) => o.dimensions?.includes(dimension));
  }

  return NextResponse.json(
    { veins, smallOres },
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
