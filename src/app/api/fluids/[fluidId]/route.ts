import { NextRequest, NextResponse } from "next/server";
import {
  getFluidsIndex,
  decodeItemId,
  encodeItemId,
  isReadableItemId,
  parseReadableItemId,
} from "@/lib/data";

function parseFluidId(readableId: string): string {
  // For fluids, we need to handle both item-style IDs (with colons) and fluid names (with dots)
  // If it contains hyphens, convert them to dots for fluid names
  if (readableId.includes("-")) {
    return readableId.replace(/-/g, "."); // Convert hyphens to dots
  }
  // Otherwise, it's already in the correct format
  return readableId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fluidId: string }> },
) {
  const { fluidId } = await params;
  const version = request.nextUrl.searchParams.get("version") || undefined;

  try {
    // Handle both readable and encoded IDs for backward compatibility
    let actualFluidId: string;
    if (isReadableItemId(fluidId)) {
      actualFluidId = parseFluidId(fluidId);
    } else {
      actualFluidId = decodeItemId(fluidId);
    }

    // Check for invalid fluid names
    if (
      !actualFluidId ||
      actualFluidId === "undefined" ||
      actualFluidId.trim() === ""
    ) {
      return NextResponse.json({ error: "Invalid fluid ID" }, { status: 400 });
    }

    const allFluids = getFluidsIndex(version);
    const fluid = allFluids.find((f: any) => f.name === actualFluidId);

    if (!fluid) {
      return NextResponse.json({ error: "Fluid not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        fluid,
      },
      {
        headers: { "Cache-Control": "public, max-age=86400" },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid fluid ID" }, { status: 400 });
  }
}
