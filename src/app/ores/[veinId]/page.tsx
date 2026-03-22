import { readFileSync } from "fs";
import { join } from "path";
import OreVeinDetailClient from "@/components/pages/OreVeinDetailClient";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const [veins, smallOres] = [
      JSON.parse(readFileSync(join(process.cwd(), "public", "data", "ore-veins.json"), "utf8")),
      JSON.parse(readFileSync(join(process.cwd(), "public", "data", "small-ores.json"), "utf8")),
    ];
    const ids = new Set<string>();
    [...veins, ...smallOres].forEach((item: { name: string }) =>
      ids.add(item.name.replace(/\./g, "-")),
    );
    return Array.from(ids).map((veinId) => ({ veinId }));
  } catch {
    return [{ veinId: "_" }];
  }
}

export default function Page({
  params,
}: {
  params: Promise<{ veinId: string }>;
}) {
  return <OreVeinDetailClient params={params} />;
}
