import { NextRequest, NextResponse } from "next/server";
import { getOreVeins, getSmallOres } from "@/lib/data";

function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeId(encoded: string): string {
  return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ veinId: string }> }
) {
  const { veinId } = await params;
  const version = request.nextUrl.searchParams.get("version") || undefined;

  try {
    const decodedId = decodeId(veinId);
    const allVeins = getOreVeins(version);
    const allSmallOres = getSmallOres(version);
    
    const vein = allVeins.find((v: any) => v.name === decodedId);
    const smallOre = allSmallOres.find((o: any) => o.name === decodedId);

    if (!vein && !smallOre) {
      return NextResponse.json({ error: "Ore vein not found" }, { status: 404 });
    }

    // Find related veins in the same dimensions
    const relatedVeins = allVeins.filter((v: any) => {
      if (vein && v.name !== vein.name) {
        return v.dimensions?.some((dim: string) => vein.dimensions?.includes(dim));
      }
      return false;
    });

    // Find related small ores in the same dimensions  
    const relatedSmallOres = allSmallOres.filter((o: any) => {
      if (vein && o.name !== vein.name) {
        return o.dimensions?.some((dim: string) => vein.dimensions?.includes(dim));
      }
      return false;
    });

    return NextResponse.json({
      vein: vein || null,
      smallOre: smallOre || null,
      relatedVeins,
      relatedSmallOres
    }, {
      headers: { "Cache-Control": "public, max-age=86400" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid vein ID" }, { status: 400 });
  }
}
