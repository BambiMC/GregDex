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
    const routes = new Set<string>(
      items.map((item: { id: string }) => createReadableItemId(item.id)),
    );

    // Also include item IDs from blood-magic.json (they may use meta=0
    // which isn't in the items index, but should still have a page)
    try {
      const bm = JSON.parse(
        readFileSync(join(process.cwd(), "public", "data", "blood-magic.json"), "utf8"),
      );
      const ids: string[] = [];
      for (const r of bm.altarRecipes || []) {
        if (r.input?.id) ids.push(r.input.id);
        if (r.output?.id) ids.push(r.output.id);
      }
      for (const r of bm.alchemyRecipes || []) {
        if (r.output?.id) ids.push(r.output.id);
        for (const inp of r.inputs || []) if (inp.id) ids.push(inp.id);
      }
      for (const id of ids) routes.add(createReadableItemId(id));
    } catch {
      // blood-magic.json missing — skip
    }

    return Array.from(routes).map((itemId) => ({ itemId }));
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
