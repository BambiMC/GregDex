import { readFileSync } from "fs";
import { join } from "path";
import MaterialDetailClient from "@/components/pages/MaterialDetailClient";
import { encodeId } from "../../../lib/encoding";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const materials = JSON.parse(
      readFileSync(join(process.cwd(), "public", "data", "materials.json"), "utf8"),
    );
    return materials.map((m: { name: string }) => ({
      materialName: encodeId(m.name),
    }));
  } catch {
    return [{ materialName: "_" }];
  }
}

export default function Page({
  params,
}: {
  params: Promise<{ materialName: string }>;
}) {
  return <MaterialDetailClient params={params} />;
}
