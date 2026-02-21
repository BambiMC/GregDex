import { NextResponse } from "next/server";
import { getMachines } from "@/lib/data";

export async function GET() {
  const machines = getMachines();
  return NextResponse.json(
    { machines },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
