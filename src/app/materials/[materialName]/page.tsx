import { readFileSync } from "fs";
import { join } from "path";
import MaterialDetailClient from "@/components/pages/MaterialDetailClient";

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
    const materials = JSON.parse(
      readFileSync(join(process.cwd(), "data", "materials.json"), "utf8"),
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
