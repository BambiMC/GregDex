import { readFileSync } from "fs";
import { join } from "path";
import ItemDetailClient from "@/components/pages/ItemDetailClient";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const items = JSON.parse(
      readFileSync(join(process.cwd(), "data", "items-index.json"), "utf8"),
    );
    return items.map((item: { id: string }) => ({
      itemId: item.id.replace(/:/g, "-"),
    }));
  } catch {
    return [{ itemId: "_" }];
  }
}

export default function Page({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  return <ItemDetailClient params={params} />;
}
