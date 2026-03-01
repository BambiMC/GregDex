import { readFileSync } from "fs";
import { join } from "path";
import BeeSpeciesDetailClient from "@/components/pages/BeeSpeciesDetailClient";

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
    const species = JSON.parse(
      readFileSync(join(process.cwd(), "data", "bee-species.json"), "utf8"),
    );
    return species.map((s: { uid: string }) => ({ speciesId: encodeId(s.uid) }));
  } catch {
    return [{ speciesId: "_" }];
  }
}

export default function Page({
  params,
}: {
  params: Promise<{ speciesId: string }>;
}) {
  return <BeeSpeciesDetailClient params={params} />;
}
