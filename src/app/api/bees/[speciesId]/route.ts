import { NextRequest, NextResponse } from "next/server";
import { getBeeSpecies, getBeeMutations } from "@/lib/data";

function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeId(encoded: string): string {
  return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ speciesId: string }> }
) {
  const { speciesId } = await params;
  const version = request.nextUrl.searchParams.get("version") || undefined;

  try {
    const decodedId = decodeId(speciesId);
    const allSpecies = getBeeSpecies(version);
    const species = allSpecies.find((s: any) => s.uid === decodedId);

    if (!species) {
      return NextResponse.json({ error: "Species not found" }, { status: 404 });
    }

    const allMutations = getBeeMutations(version);
    
    // Find mutations where this species is involved
    const asParent1 = allMutations.filter((m: any) => m.parent1Uid === decodedId);
    const asParent2 = allMutations.filter((m: any) => m.parent2Uid === decodedId);
    const asOffspring = allMutations.filter((m: any) => m.offspringUid === decodedId);

    return NextResponse.json({
      species,
      mutations: {
        asParent1,
        asParent2,
        asOffspring
      }
    }, {
      headers: { "Cache-Control": "public, max-age=86400" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid species ID" }, { status: 400 });
  }
}
