import { NextRequest, NextResponse } from "next/server";
import { getItem, getRecipeChunk } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const version = request.nextUrl.searchParams.get("version") || undefined;
  const item = getItem(itemId, version);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Fetch actual recipes for the first few references
  const outputRecipes: any[] = [];
  const inputRecipes: any[] = [];

  // Limit to first 50 recipes per direction to avoid huge responses
  const outputRefs = (item.recipesAsOutput || []).slice(0, 50);
  const inputRefs = (item.recipesAsInput || []).slice(0, 50);

  for (const ref of outputRefs) {
    const chunk = getRecipeChunk(ref.machine, ref.chunk, version);
    if (chunk[ref.index]) {
      outputRecipes.push(chunk[ref.index]);
    }
  }

  for (const ref of inputRefs) {
    const chunk = getRecipeChunk(ref.machine, ref.chunk, version);
    if (chunk[ref.index]) {
      inputRecipes.push(chunk[ref.index]);
    }
  }

  return NextResponse.json(
    {
      item,
      outputRecipes,
      inputRecipes,
      totalOutputRecipes: (item.recipesAsOutput || []).length,
      totalInputRecipes: (item.recipesAsInput || []).length,
    },
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
