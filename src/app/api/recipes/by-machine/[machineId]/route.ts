import { NextRequest, NextResponse } from "next/server";
import { getMachines, getRecipeChunk } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const { machineId } = await params;
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

  const machines = getMachines();
  const machine = machines.find((m) => m.id === machineId);

  if (!machine) {
    return NextResponse.json({ error: "Machine not found" }, { status: 404 });
  }

  // Calculate which chunks we need
  const CHUNK_SIZE = 500;
  const startIdx = (page - 1) * limit;
  const endIdx = startIdx + limit;
  const startChunk = Math.floor(startIdx / CHUNK_SIZE);
  const endChunk = Math.floor((endIdx - 1) / CHUNK_SIZE);

  const recipes: any[] = [];
  for (let c = startChunk; c <= endChunk && c < machine.chunks; c++) {
    const chunk = getRecipeChunk(machineId, c);
    const chunkStart = c * CHUNK_SIZE;
    for (let i = 0; i < chunk.length; i++) {
      const globalIdx = chunkStart + i;
      if (globalIdx >= startIdx && globalIdx < endIdx) {
        recipes.push(chunk[i]);
      }
    }
  }

  return NextResponse.json(
    {
      machine,
      recipes,
      total: machine.recipeCount,
      page,
      totalPages: Math.ceil(machine.recipeCount / limit),
    },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
