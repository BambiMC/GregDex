import { readFileSync } from "fs";
import { join } from "path";
import ItemDetailClient from "@/components/pages/ItemDetailClient";
import { createReadableItemId } from "@/lib/utils";

export const dynamicParams = false;

export function generateStaticParams() {
  try {
    const items = JSON.parse(
      readFileSync(join(process.cwd(), "public", "data", "items-index.json"), "utf8"),
    );
    return items.map((item: { id: string }) => ({
      itemId: createReadableItemId(item.id),
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
