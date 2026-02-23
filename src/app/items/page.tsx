"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ItemIcon from "@/components/ItemIcon";
import { createReadableItemId } from "@/lib/utils";

interface ItemEntry {
  id: string;
  displayName: string;
  modId: string;
  type?: "item" | "fluid";
}

function createReadableFluidId(fluidId: string): string {
  // For fluids, convert dots to hyphens for readable URLs
  return fluidId.replace(/\./g, "-");
}

function getItemUrl(item: ItemEntry): string {
  return item.type === "fluid"
    ? `/fluids/${createReadableFluidId(item.id)}`
    : `/items/${createReadableItemId(item.id)}`;
}

function getItemIcon(item: ItemEntry): React.ReactElement {
  if (item.type === "fluid") {
    return (
      <div className="w-full h-full bg-accent-secondary/10 border border-accent-secondary/30 rounded flex items-center justify-center">
        <span className="text-[10px] text-accent-secondary font-bold">
          {item.displayName.substring(0, 2)}
        </span>
      </div>
    );
  }
  return <ItemIcon itemId={item.id} displayName={item.displayName} size={28} />;
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      if (q.length >= 2) {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=60`,
        );
        const data = await res.json();
        setItems(
          (data.results || []).map((r: any) => ({
            id: r.id,
            displayName: r.displayName,
            modId: r.modId || "",
            type: r.type || "item",
          })),
        );
        setTotal(data.results?.length || 0);
        setTotalPages(1);
      } else {
        const res = await fetch(`/api/items?page=${p}&limit=60`);
        const data = await res.json();
        setItems(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchItems(page, search), 200);
    return () => clearTimeout(timeout);
  }, [page, search, fetchItems]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Items</h1>
        <p className="text-text-secondary text-sm mb-6">
          {total.toLocaleString()} items
        </p>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filter items..."
            className="w-full max-w-md px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-bg-tertiary border border-border-default rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={getItemUrl(item)}
                className="flex items-center gap-3 px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg hover:border-border-bright transition-colors group"
              >
                <div className="item-slot !w-8 !h-8 shrink-0 group-hover:border-accent-primary">
                  {getItemIcon(item)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary truncate group-hover:text-accent-primary transition-colors">
                    {item.displayName}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {item.modId}
                    {item.type === "fluid" && (
                      <span className="ml-1 px-1.5 py-0.5 bg-accent-secondary/10 text-accent-secondary rounded text-[10px]">
                        Fluid
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
