import { NextRequest, NextResponse } from "next/server";
import { getOreVeins, getSmallOres } from "@/lib/data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dimensionsParam = searchParams.get("dimensions") || "";
  const singleDimension = searchParams.get("dimension") || "";
  const version = searchParams.get("version") || undefined;

  let veins = getOreVeins(version);
  let smallOres = getSmallOres(version);

  // Handle multiple dimensions (comma-separated)
  if (dimensionsParam) {
    const dimensions = dimensionsParam.split(",").filter((d) => d.trim());
    veins = veins.filter(
      (v: any) =>
        dimensions.length === 0 ||
        v.dimensions?.some((d: string) => dimensions.includes(d)),
    );
    smallOres = smallOres.filter(
      (o: any) =>
        dimensions.length === 0 ||
        o.dimensions?.some((d: string) => dimensions.includes(d)),
    );
  }
  // Handle legacy single dimension parameter
  else if (singleDimension) {
    veins = veins.filter((v: any) => v.dimensions?.includes(singleDimension));
    smallOres = smallOres.filter((o: any) =>
      o.dimensions?.includes(singleDimension),
    );
  }

  return NextResponse.json(
    { veins, smallOres },
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
