import { readFileSync } from "fs";
import { join } from "path";
import BeeSpeciesDetailClient from "@/components/pages/BeeSpeciesDetailClient";
import { encodeId } from "../../../lib/encoding";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const species = JSON.parse(
      readFileSync(join(process.cwd(), "public", "data", "bee-species.json"), "utf8"),
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
