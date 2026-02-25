import { NextRequest, NextResponse } from "next/server";
import {
  getFluidsIndex,
  decodeItemId,
  isReadableItemId,
  parseReadableItemId,
  getRecipeChunk,
  getMachines,
} from "@/lib/data";

function parseFluidId(readableId: string): string {
  // First decode URL encoding, then convert hyphens to dots
  const decoded = decodeURIComponent(readableId);
  let result = decoded;

  // If it contains hyphens, convert them to dots for fluid names
  if (result.includes("-")) {
    result = result.replace(/-/g, ".");
  }

  // Handle case where commas weren't URL-encoded properly
  // This can happen in some browsers or when typing URLs manually
  if (!result.includes(".") && result.includes(",")) {
    // If it looks like a comma-separated format without dots, it's probably correct
    return result;
  }

  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fluidId: string }> },
) {
  const { fluidId } = await params;
  const version = request.nextUrl.searchParams.get("version") || undefined;

  // Force console output
  console.error("=== API CALLED WITH FLUID ID:", fluidId, "===");

  console.log("API received fluidId:", fluidId);

  try {
    // Handle both readable and encoded IDs for backward compatibility
    let actualFluidId: string;
    if (isReadableItemId(fluidId)) {
      actualFluidId = parseFluidId(fluidId);
    } else {
      actualFluidId = decodeItemId(fluidId);
    }

    console.log("API processed actualFluidId:", actualFluidId);

    // Check for invalid fluid names
    if (
      !actualFluidId ||
      actualFluidId === "undefined" ||
      actualFluidId.trim() === ""
    ) {
      console.log("Invalid fluid ID");
      return NextResponse.json({ error: "Invalid fluid ID" }, { status: 400 });
    }

    const allFluids = getFluidsIndex(version);
    console.log("All fluids count:", allFluids.length);
    console.log("Looking for fluid name:", actualFluidId);
    console.log(
      "Available fluids:",
      allFluids.slice(0, 5).map((f) => f.name),
    );

    const fluid = allFluids.find((f: any) => f.name === actualFluidId);
    console.log("Found fluid:", fluid);
    console.log("Fluid match result:", fluid ? "SUCCESS" : "FAILED");

    if (!fluid) {
      console.log("Fluid not found");
      return NextResponse.json({ error: "Fluid not found" }, { status: 404 });
    }

    // Get machines and their recipe chunks
    const machines = getMachines(version);
    console.log("Machines count:", machines.length);

    const recipes: any[] = [];
    const recipeCounts: Record<string, number> = {};

    for (const machine of machines) {
      const machineId = machine.id;
      const recipeCount = machine.recipeCount || 0;

      if (recipeCount <= 0) continue;

      console.log(`Processing machine: ${machineId} (${recipeCount} recipes)`);

      // Load recipe chunks
      for (let chunkNum = 0; chunkNum < (machine.chunks || 0); chunkNum++) {
        try {
          const chunk = getRecipeChunk(machineId, chunkNum, version);
          if (chunk && chunk.length > 0) {
            console.log(
              `Processing chunk ${chunkNum} for ${machineId} (${chunk.length} recipes)`,
            );
            for (const recipe of chunk) {
              // Check if this recipe uses our fluid
              const usesFluid =
                (recipe.fluidInputs &&
                  recipe.fluidInputs.some(
                    (f: any) => String(f.id) === String(actualFluidId),
                  )) ||
                (recipe.fluidOutputs &&
                  recipe.fluidOutputs.some(
                    (f: any) => String(f.id) === String(actualFluidId),
                  ));

              if (usesFluid) {
                console.log(
                  `✓ FOUND MATCHING RECIPE in ${machineId}:`,
                  recipe.machine,
                );
                recipeCounts[machineId] = (recipeCounts[machineId] || 0) + 1;
                recipes.push(recipe);
              }
            }
          }
        } catch (e) {
          console.log(
            `Error loading recipe chunk ${chunkNum} for ${machineId}:`,
            e,
          );
          // Skip files that don't exist or have errors
        }
      }
    }

    // Separate recipes into output and input
    const outputRecipes = recipes.filter((recipe) =>
      recipe.fluidOutputs?.some(
        (f: any) => String(f.id) === String(actualFluidId),
      ),
    );
    const inputRecipes = recipes.filter((recipe) =>
      recipe.fluidInputs?.some(
        (f: any) => String(f.id) === String(actualFluidId),
      ),
    );

    console.log("Final recipes count:", recipes.length);
    console.log("Output recipes:", outputRecipes.length);
    console.log("Input recipes:", inputRecipes.length);
    console.log("Recipe counts:", recipeCounts);

    return NextResponse.json(
      {
        fluid,
        outputRecipes: outputRecipes.slice(0, 50), // Limit to first 50
        inputRecipes: inputRecipes.slice(0, 50), // Limit to first 50
        totalOutputRecipes: outputRecipes.length,
        totalInputRecipes: inputRecipes.length,
        recipeCounts,
      },
      {
        headers: { "Cache-Control": "public, max-age=86400" },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid fluid ID" }, { status: 400 });
  }
}
