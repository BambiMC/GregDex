import { NextRequest, NextResponse } from "next/server";
import { getTrigramIndex, getItemsIndex, getFluidsIndex } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "15");
  const version = request.nextUrl.searchParams.get("version") || undefined;

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = q.toLowerCase();
  const itemsIndex = getItemsIndex(version);
  const trigramIndex = getTrigramIndex(version);

  // Extract trigrams from query
  const queryTrigrams: string[] = [];
  for (let i = 0; i <= query.length - 3; i++) {
    queryTrigrams.push(query.substring(i, i + 3));
  }

  // Score items by trigram overlap
  const scores = new Map<number, number>();

  for (const tri of queryTrigrams) {
    const postings = trigramIndex[tri];
    if (postings) {
      for (const idx of postings) {
        scores.set(idx, (scores.get(idx) || 0) + 1);
      }
    }
  }

  // Build results with boosted exact substring matches
  const results: {
    id: string;
    displayName: string;
    modId: string;
    type: "item" | "fluid";
    score: number;
  }[] = [];

  for (const [idx, trigramScore] of scores) {
    const item = itemsIndex[idx];
    if (!item) continue;

    let score = trigramScore;
    const nameLower = item.displayName.toLowerCase();

    // Boost exact substring match
    if (nameLower.includes(query)) {
      score += 100;
      // Extra boost for exact match
      if (nameLower === query) score += 200;
      // Boost for starts-with
      if (nameLower.startsWith(query)) score += 50;
    }

    results.push({
      id: item.id,
      displayName: item.displayName,
      modId: item.modId,
      type: "item",
      score,
    });
  }

  // Also search fluids
  const fluidsIndex = getFluidsIndex(version);
  for (const fluid of fluidsIndex) {
    const nameLower = fluid.displayName.toLowerCase();
    if (nameLower.includes(query)) {
      results.push({
        id: fluid.name,
        displayName: fluid.displayName,
        modId: "",
        type: "fluid",
        score:
          nameLower === query ? 300 : nameLower.startsWith(query) ? 150 : 50,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return NextResponse.json(
    { results: results.slice(0, limit) },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
