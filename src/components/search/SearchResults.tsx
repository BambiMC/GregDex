"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/types";
import ItemIcon from "@/components/ItemIcon";
import { createReadableItemId } from "@/lib/utils";

// Local caches (duplicate of GlobalSearch's simple loader to keep this component standalone)
let itemsCache: { id: string; displayName: string; modId: string }[] | null = null;
let itemsCachePromise: Promise<void> | null = null;
let beesCache: { uid: string; displayName: string; branch: string }[] | null = null;
let beesCachePromise: Promise<void> | null = null;

function loadItemsCache(): Promise<void> {
    if (itemsCache) return Promise.resolve();
    if (itemsCachePromise) return itemsCachePromise;
    itemsCachePromise = fetch("/data/items-index.json")
        .then((r) => r.json())
        .then((d) => {
            itemsCache = d;
        })
        .catch(() => {
            itemsCache = [];
        });
    return itemsCachePromise;
}

function loadBeeCache(): Promise<void> {
    if (beesCache) return Promise.resolve();
    if (beesCachePromise) return beesCachePromise;
    beesCachePromise = fetch("/data/bee-species.json")
        .then((r) => r.json())
        .then((d) => {
            beesCache = d.map((s: any) => ({
                uid: s.uid,
                displayName: s.binomial,
                branch: s.branch || "Unknown",
            }));
        })
        .catch(() => {
            beesCache = [];
        });
    return beesCachePromise;
}

export default function SearchResults({ query }: { query: string }) {
    interface ItemEntry {
        id: string;
        displayName: string;
        modId: string;
        type?: "item" | "fluid" | "bee";
    }

    function createReadableFluidId(fluidId: string): string {
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

    const LIMIT = 60;
    const [allItems, setAllItems] = useState<ItemEntry[]>([]);
    const allRef = useRef<ItemEntry[]>([]);
    const [items, setItems] = useState<ItemEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState(query || "");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // load caches and build combined list
    useEffect(() => {
        const run = async () => {
            setLoading(true);
            try {
                await Promise.all([loadItemsCache(), loadBeeCache()]);
                const itemsList = (itemsCache || []).map((it) => ({
                    id: it.id,
                    displayName: it.displayName,
                    modId: it.modId,
                    type: "item" as const,
                }));
                const beesList = (beesCache || []).map((b) => ({
                    id: b.uid,
                    displayName: b.displayName,
                    modId: "Forestry",
                    type: "bee" as const,
                }));
                const combined: ItemEntry[] = [...itemsList, ...beesList];
                allRef.current = combined;
                setAllItems(combined);
            } catch {
                allRef.current = [];
                setAllItems([]);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    const applyFilter = useCallback(
        (q: string, p: number, all: ItemEntry[]) => {
            let filtered = all;
            if (q.length >= 2) {
                const lower = q.toLowerCase();
                filtered = all.filter(
                    (item) =>
                        item.displayName.toLowerCase().includes(lower) ||
                        item.modId.toLowerCase().includes(lower) ||
                        item.id.toLowerCase().includes(lower),
                );
            }
            const tp = Math.max(1, Math.ceil(filtered.length / LIMIT));
            const safePage = Math.min(p, tp);
            const start = (safePage - 1) * LIMIT;
            setItems(filtered.slice(start, start + LIMIT));
            setTotal(filtered.length);
            setTotalPages(tp);
        },
        [],
    );

    useEffect(() => {
        if (allItems.length > 0) applyFilter(search, page, allItems);
    }, [search, page, allItems, applyFilter]);

    useEffect(() => setSearch(query || ""), [query]);

    const navigate = (item: ItemEntry) => {
        router.push(getItemUrl(item));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-lg font-semibold">Results for “{query}”</h2>
                <div className="text-text-secondary text-sm mb-4">{total.toLocaleString()} result{total !== 1 ? "s" : ""}</div>

                <div className="mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Filter results..."
                        className="w-full max-w-md px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-14 bg-bg-tertiary border border-border-default rounded-lg animate-pulse" />
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
                                    <div className="text-sm text-text-primary truncate group-hover:text-accent-primary transition-colors">{item.displayName}</div>
                                    <div className="text-xs text-text-muted truncate">{item.modId}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
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
