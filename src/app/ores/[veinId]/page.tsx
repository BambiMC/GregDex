import { readFileSync } from "fs";
import { join } from "path";
import OreVeinDetailClient from "@/components/pages/OreVeinDetailClient";

export const dynamicParams = false;

function encodeId(id: string): string {
  return Buffer.from(id)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateStaticParams() {
  try {
    const [veins, smallOres] = [
      JSON.parse(readFileSync(join(process.cwd(), "data", "ore-veins.json"), "utf8")),
      JSON.parse(readFileSync(join(process.cwd(), "data", "small-ores.json"), "utf8")),
    ];
    const ids = new Set<string>();
    [...veins, ...smallOres].forEach((item: { name: string }) =>
      ids.add(encodeId(item.name)),
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
