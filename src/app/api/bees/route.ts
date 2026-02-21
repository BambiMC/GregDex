import { NextRequest, NextResponse } from "next/server";
import { getBeeMutations, getBeeSpecies } from "@/lib/data";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "mutations";
  const q = request.nextUrl.searchParams.get("q") || "";

  if (type === "species") {
    let species = getBeeSpecies();
    if (q) {
      const query = q.toLowerCase();
      species = species.filter(
        (s: any) =>
          s.uid?.toLowerCase().includes(query) ||
          s.binomial?.toLowerCase().includes(query) ||
          s.branch?.toLowerCase().includes(query)
      );
    }
    return NextResponse.json(
      { species },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  }

  let mutations = getBeeMutations();
  if (q) {
    const query = q.toLowerCase();
    mutations = mutations.filter(
      (m: any) =>
        m.parent1Uid?.toLowerCase().includes(query) ||
        m.parent2Uid?.toLowerCase().includes(query) ||
        m.offspringUid?.toLowerCase().includes(query)
    );
  }

  return NextResponse.json(
    { mutations },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
