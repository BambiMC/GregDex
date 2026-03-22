"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/types";
import ItemIcon from "@/components/ItemIcon";
import { createReadableItemId } from "@/lib/utils";

function BeeIcon({ uid, displayName }: { uid: string; displayName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-xl">🐝</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/items/bee_${uid.toLowerCase()}.png`}
      alt={displayName}
      width={28}
      height={28}
      className="pixelated"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

// Module-level cache — loaded once per browser session
let itemsCache: { id: string; displayName: string; modId: string }[] | null = null;
let itemsCachePromise: Promise<void> | null = null;
let beesCache: { uid: string; displayName: string; branch: string }[] | null = null;
let beesCachePromise: Promise<void> | null = null;

function loadItemsCache(): Promise<void> {
  if (itemsCache) return Promise.resolve();
  if (itemsCachePromise) return itemsCachePromise;
  itemsCachePromise = fetch("/data/items-index.json")
    .then((r) => r.json())
    .then((d) => { itemsCache = d; })
    .catch(() => { itemsCache = []; });
  return itemsCachePromise;
}

function loadBeeCache(): Promise<void> {
  if (beesCache) return Promise.resolve();
  if (beesCachePromise) return beesCachePromise;
  beesCachePromise = fetch("/data/bee-species.json")
    .then((r) => r.json())
    .then((d) => {
      beesCache = d.map((s: any) => {
        const parts = (s.uid as string).split(".");
        let name = parts[parts.length - 1].replace(/^species/i, "");
        name = name.replace(/([a-z])([A-Z])/g, "$1 $2") || s.uid;
        return {
          uid: s.uid,
          displayName: name + " Bee",
          branch: s.branch || "Unknown",
        };
      });
    })
    .catch(() => { beesCache = []; });
  return beesCachePromise;
}

export default function GlobalSearch({
  open,
  onClose,
  onOpen,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, onOpen]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      await Promise.all([loadItemsCache(), loadBeeCache()]);
      const lower = q.toLowerCase();

      const itemsMatches = (itemsCache || [])
        .filter(
          (item) =>
            item.displayName.toLowerCase().includes(lower) ||
            item.modId.toLowerCase().includes(lower) ||
            item.id.toLowerCase().includes(lower),
        )
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          displayName: item.displayName,
          modId: item.modId,
          type: "item" as const,
          score: 1,
        }));

      const beeMatches = (beesCache || [])
        .filter((bee) =>
          bee.displayName.toLowerCase().includes(lower) ||
          bee.branch.toLowerCase().includes(lower) ||
          bee.uid.toLowerCase().includes(lower),
        )
        .slice(0, 5)
        .map((bee) => ({
          id: bee.uid,
          displayName: bee.displayName,
          modId: "Forestry",
          type: "bee" as const,
          score: 1,
        }));

      setResults([...itemsMatches, ...beeMatches]);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const navigate = (result: SearchResult) => {
    if (result.type === "item") {
      const readableId = createReadableItemId(result.id);
      router.push(`/items/${readableId}`);
    } else if (result.type === "fluid") {
      // For fluids, convert dots to hyphens for readable URLs
      const readableFluidId = result.id.replace(/\./g, "-");
      router.push(`/fluids/${readableFluidId}`);
    } else if (result.type === "bee") {
      // For bees, use a readable uid (e.g. forestry.speciesForest)
      router.push(`/bees/${createReadableItemId(result.id)}`);
    }
    onClose();
    setQuery("");
  };

  const viewAll = () => {
    if (query.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onClose();
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <div className="bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 border-b border-border-default">
            <svg
              className="w-5 h-5 text-text-muted shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search items, fluids, materials, bee species..."
              className="flex-1 py-3 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            )}
            <div className="flex items-center gap-2">
              {query.length >= 2 && (
                <button
                  type="button"
                  onClick={viewAll}
                  className="text-sm text-accent-primary/90 hover:underline"
                >
                  View all
                </button>
              )}
              <kbd className="text-xs text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded border border-border-default">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((result, i) => (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => navigate(result)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${i === selectedIndex
                    ? "bg-accent-primary/10 text-accent-primary"
                    : "text-text-primary hover:bg-bg-elevated"
                    }`}
                >
                  <div className="item-slot w-8! h-8! shrink-0">
                    {result.type === "bee" ? (
                      <BeeIcon uid={result.id} displayName={result.displayName} />
                    ) : (
                      <ItemIcon
                        itemId={result.id}
                        displayName={result.displayName}
                        size={28}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{result.displayName}</div>
                    {result.modId && (
                      <div className="text-xs text-text-muted truncate">
                        {result.modId}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {/* removed bottom 'View all' — it's now in the input row */}
            </div>
          )}

          {/* Empty state */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="py-8 text-center text-text-muted text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Hint */}
          {query.length < 2 && (
            <div className="py-8 text-center text-text-muted text-sm">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
