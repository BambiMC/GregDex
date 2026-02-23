import { NextRequest, NextResponse } from "next/server";
import {
  getMachines,
  getRecipeChunk,
  decodeItemId,
  isReadableItemId,
  parseReadableItemId,
} from "@/lib/data";

function shouldIncludeRecipe(recipe: any, searchLower: string): boolean {
  try {
    // Search through recipe inputs and outputs
    const searchTexts = [
      ...(recipe.itemInputs || []).map((item: any) => item?.displayName || ""),
      ...(recipe.itemOutputs || []).map((item: any) => item?.displayName || ""),
      ...(recipe.fluidInputs || []).map(
        (fluid: any) => fluid?.displayName || "",
      ),
      ...(recipe.fluidOutputs || []).map(
        (fluid: any) => fluid?.displayName || "",
      ),
    ];

    return searchTexts.some((text) => {
      if (!text) return false;
      const textLower = text.toLowerCase();

      // Exact match
      if (textLower.includes(searchLower)) return true;

      // Handle partial matching for short searches (like "oxy" -> "oxygen")
      if (searchLower.length >= 3) {
        // Check if search term is contained in the text
        if (textLower.includes(searchLower)) return true;
        // Check if text contains the search term as part of a word
        if (
          textLower
            .split(" ")
            .some((word: string) => word.includes(searchLower))
        )
          return true;
      }

      return false;
    });
  } catch (error) {
    console.error("Error in shouldIncludeRecipe:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> },
) {
  try {
    const { machineId } = await params;
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const search = request.nextUrl.searchParams.get("search") || "";
    const version = request.nextUrl.searchParams.get("version") || undefined;

    // Simple debug log
    console.log(`API called: machine=${machineId}, search="${search}"`);

    // Handle both readable and encoded machine IDs
    let actualMachineId: string;
    if (isReadableItemId(machineId)) {
      actualMachineId = parseReadableItemId(machineId);
    } else {
      actualMachineId = decodeItemId(machineId);
    }

    const machines = getMachines(version);
    const machine = machines.find((m) => m.id === actualMachineId);

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
    const searchLower = search.toLowerCase();
    let filteredTotal = 0;

    // First pass: count all matching recipes for pagination
    if (search) {
      console.log(
        `Searching for "${search}" in machine with ${machine.chunks} chunks`,
      );
      for (let c = 0; c < machine.chunks; c++) {
        const chunk = getRecipeChunk(machineId, c, version);
        for (const recipe of chunk) {
          if (shouldIncludeRecipe(recipe, searchLower)) {
            filteredTotal++;
            if (filteredTotal <= 3) {
              console.log(`Found match #${filteredTotal}:`, {
                itemInputs: recipe.itemInputs?.map((i: any) => i.displayName),
                itemOutputs: recipe.itemOutputs?.map((i: any) => i.displayName),
                fluidInputs: recipe.fluidInputs?.map((f: any) => f.displayName),
                fluidOutputs: recipe.fluidOutputs?.map(
                  (f: any) => f.displayName,
                ),
              });
            }
          }
        }
      }
      console.log(`Total matches: ${filteredTotal}`);
    }

    // Second pass: get recipes for current page
    for (let c = startChunk; c <= endChunk && c < machine.chunks; c++) {
      const chunk = getRecipeChunk(machineId, c, version);
      const chunkStart = c * CHUNK_SIZE;
      for (let i = 0; i < chunk.length; i++) {
        const globalIdx = chunkStart + i;
        if (globalIdx >= startIdx && globalIdx < endIdx) {
          const recipe = chunk[i];
          // Filter by search if provided
          if (!search || shouldIncludeRecipe(recipe, searchLower)) {
            recipes.push(recipe);
          }
        }
      }
    }

    return NextResponse.json(
      {
        machine,
        recipes,
        total: search ? filteredTotal : machine.recipeCount,
        page,
        totalPages: Math.ceil(
          (search ? filteredTotal : machine.recipeCount) / limit,
        ),
      },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  } catch (error) {
    console.error("Error in machine recipes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
