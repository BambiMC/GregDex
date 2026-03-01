import { readFileSync } from "fs";
import { join } from "path";
import FluidDetailClient from "@/components/pages/FluidDetailClient";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const fluids = JSON.parse(
      readFileSync(join(process.cwd(), "data", "fluids-index.json"), "utf8"),
    );
    return fluids.map((f: { name: string }) => ({
      fluidId: f.name.replace(/\./g, "-"),
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
  return <FluidDetailClient params={params} />;
}
