import { readFileSync } from "fs";
import { join } from "path";
import FluidGasesDetailClient from "@/components/pages/FluidGasesDetailClient";
import { createReadableItemId } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const fluids = JSON.parse(
      readFileSync(join(process.cwd(), "public", "data", "fluids-index.json"), "utf8"),
    );
    return fluids.map((f: { name: string }) => ({
      fluidId: createReadableItemId(f.name.replace(/\./g, "-")),
    }));
  } catch {
    return [{ fluidId: "_" }];
  }
}

export default function Page({
  params,
}: {
  params: Promise<{ fluidId: string }>;
}) {
  return <FluidGasesDetailClient params={params} />;
}
