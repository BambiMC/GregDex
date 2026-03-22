"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ItemIcon from "@/components/ItemIcon";
import { createReadableItemId } from "@/lib/utils";

interface LootBag {
  id: string;
  displayName: string;
  metadata: number;
}

interface LootBagUpgrade {
  input: { id: string; displayName: string; amount: number };
  output: { id: string; displayName: string; amount: number };
  euPerTick: number;
  duration: number;
}

interface LootDrop {
  item: { id: string; displayName: string; amount: number };
  weight: number;
  amount: number;
  isRandomAmount?: boolean;
  limitedDropCount?: number;
  dropGroup?: string;
}

interface LootGroup {
  groupId: number;
  name: string;
  bagItem: { id: string; displayName: string; amount: number };
  minItems: number;
  maxItems: number;
  maxWeight: number;
  drops: LootDrop[];
}

interface LootBagsData {
  bags: LootBag[];
  upgrades: LootBagUpgrade[];
  groups: LootGroup[];
}

const CATEGORIES: { label: string; color: string; match: (name: string) => boolean }[] = [
  {
    label: "Tech Tiers",
    color: "text-accent-primary border-accent-primary/30 bg-accent-primary/10",
    match: (n) =>
      /basic stone age|steam age|tier \d|luv|zpm|uhv/i.test(n),
  },
  {
    label: "Magic",
    color: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    match: (n) => /magic|legendary|bm novice|bm adept|bm master/i.test(n),
  },
  {
    label: "Bees",
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    match: (n) => /bees/i.test(n),
  },
  {
    label: "Space",
    color: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    match: (n) => /space invaders/i.test(n),
  },
  {
    label: "Food",
    color: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    match: (n) => /fast food|slow food|haute cuisine|dessert/i.test(n),
  },
  {
    label: "Transportation",
    color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
    match: (n) => /transportation/i.test(n),
  },
  {
    label: "Forest Ranger",
    color: "text-green-400 border-green-400/30 bg-green-400/10",
    match: (n) => /forest ranger/i.test(n),
  },
  {
    label: "Nature",
    color: "text-lime-400 border-lime-400/30 bg-lime-400/10",
    match: (n) => /seeds|gardens|ic2 crops/i.test(n),
  },
  {
    label: "Witchery",
    color: "text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10",
    match: (n) => /witchery/i.test(n),
  },
  {
    label: "Applied Energistics",
    color: "text-sky-400 border-sky-400/30 bg-sky-400/10",
    match: (n) => /^lootbag \(ae/i.test(n),
  },
  {
    label: "Computers",
    color: "text-teal-400 border-teal-400/30 bg-teal-400/10",
    match: (n) => /computer/i.test(n),
  },
  {
    label: "HEE",
    color: "text-rose-400 border-rose-400/30 bg-rose-400/10",
    match: (n) => /hee/i.test(n),
  },
];

function categorize(bags: LootBag[]): { label: string; color: string; bags: LootBag[] }[] {
  const assigned = new Set<string>();
  const result: { label: string; color: string; bags: LootBag[] }[] = [];

  for (const cat of CATEGORIES) {
    const matched = bags.filter((b) => !assigned.has(b.id) && cat.match(b.displayName));
    if (matched.length > 0) {
      matched.forEach((b) => assigned.add(b.id));
      result.push({ label: cat.label, color: cat.color, bags: matched });
    }
  }

  const uncategorized = bags.filter((b) => !assigned.has(b.id));
  if (uncategorized.length > 0) {
    result.push({
      label: "Other",
      color: "text-text-muted border-border-default bg-bg-elevated",
      bags: uncategorized,
    });
  }

  return result;
}

function formatEU(eu: number): string {
  if (eu >= 1_000_000) return `${(eu / 1_000_000).toFixed(1)}M EU`;
  if (eu >= 1_000) return `${(eu / 1_000).toFixed(0)}k EU`;
  return `${eu} EU`;
}

function DropsPanel({ group, onClose }: { group: LootGroup; onClose: () => void }) {
  const sorted = [...group.drops].sort((a, b) => b.weight - a.weight);
  const name = group.name || group.bagItem.displayName.replace(/^LootBag \(/i, "").replace(/\)$/, "");

  return (
    <div className="mt-4 bg-bg-elevated border border-border-bright rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default bg-bg-tertiary">
        <div className="item-slot w-10! h-10! shrink-0">
          <ItemIcon itemId={group.bagItem.id} displayName={group.bagItem.displayName} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-text-primary">{name}</div>
          <div className="text-xs text-text-muted">
            {group.drops.length} possible drops · {group.minItems === group.maxItems ? group.minItems : `${group.minItems}–${group.maxItems}`} items per open
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drop table */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-120 overflow-y-auto">
        {sorted.map((drop, i) => {
          const pct = ((drop.weight / group.maxWeight) * 100).toFixed(1);
          return (
            <Link
              key={i}
              prefetch={false}
              href={`/items/${createReadableItemId(drop.item.id)}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors group"
            >
              <div className="item-slot w-8! h-8! shrink-0 group-hover:border-accent-primary/50 transition-colors">
                <ItemIcon itemId={drop.item.id} displayName={drop.item.displayName} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
                  {drop.item.displayName}
                </div>
                <div className="text-[10px] text-text-muted">
                  {drop.isRandomAmount ? `1–${drop.amount}` : `×${drop.amount}`}
                  {drop.dropGroup && (
                    <span className="ml-1 text-text-muted/60">[{drop.dropGroup}]</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-medium text-accent-primary">{pct}%</div>
                <div className="text-[10px] text-text-muted">{drop.weight}/{group.maxWeight}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function LootBagsPage() {
  const [data, setData] = useState<LootBagsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"bags" | "upgrades">("bags");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/data/lootbags.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const groupByBagId = useMemo(() => {
    if (!data?.groups) return new Map<string, LootGroup>();
    const m = new Map<string, LootGroup>();
    for (const g of data.groups) m.set(g.bagItem.id, g);
    return m;
  }, [data]);

  const selectedGroup = useMemo(() => {
    if (selectedGroupId === null || !data?.groups) return null;
    return data.groups.find((g) => g.groupId === selectedGroupId) ?? null;
  }, [selectedGroupId, data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    if (!q) return data.bags;
    return data.bags.filter((b) => b.displayName.toLowerCase().includes(q));
  }, [data, search]);

  const categories = useMemo(() => categorize(filtered), [filtered]);

  function handleBagClick(bag: LootBag) {
    const group = groupByBagId.get(bag.id);
    if (!group) return;
    setSelectedGroupId((prev) => (prev === group.groupId ? null : group.groupId));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Loot Bags</h1>
        <p className="text-text-secondary text-sm mb-6">
          {data ? `${data.bags.length} loot bags · ${data.upgrades.length} upgrade recipes` : "Loading…"}
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          <button
            type="button"
            onClick={() => setTab("bags")}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              tab === "bags"
                ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30"
                : "bg-bg-tertiary text-text-muted border border-border-default"
            }`}
          >
            Bags ({data?.bags.length ?? "…"})
          </button>
          <button
            type="button"
            onClick={() => setTab("upgrades")}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              tab === "upgrades"
                ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30"
                : "bg-bg-tertiary text-text-muted border border-border-default"
            }`}
          >
            Upgrade Recipes ({data?.upgrades.length ?? "…"})
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tab === "bags" ? (
          <>
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search loot bags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-sm bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-accent-primary/50 text-text-primary placeholder:text-text-muted"
              />
            </div>

            {/* Categorized grid */}
            <div className="space-y-8">
              {categories.map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-text-muted">{cat.bags.length} bags</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {cat.bags.map((bag) => {
                      const hasDrops = groupByBagId.has(bag.id);
                      const group = groupByBagId.get(bag.id);
                      const isSelected = group?.groupId === selectedGroupId;
                      return (
                        <button
                          key={bag.id}
                          type="button"
                          onClick={() => handleBagClick(bag)}
                          disabled={!hasDrops}
                          className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors group text-left ${
                            isSelected
                              ? "bg-accent-primary/10 border-accent-primary/50"
                              : hasDrops
                              ? "bg-bg-tertiary border-border-default hover:border-accent-primary/40 hover:bg-bg-elevated cursor-pointer"
                              : "bg-bg-tertiary border-border-default opacity-60 cursor-default"
                          }`}
                        >
                          <div className={`item-slot w-12! h-12! transition-colors ${isSelected ? "border-accent-primary/60" : "group-hover:border-accent-primary/50"}`}>
                            <ItemIcon itemId={bag.id} displayName={bag.displayName} size={36} />
                          </div>
                          <span className={`text-xs text-center leading-tight line-clamp-2 transition-colors ${isSelected ? "text-accent-primary" : "text-text-secondary group-hover:text-text-primary"}`}>
                            {bag.displayName.replace(/^LootBag \(/i, "").replace(/\)$/, "")}
                          </span>
                          {hasDrops && (
                            <span className="text-[10px] text-text-muted">
                              {group!.drops.length} drops
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Show drops panel under the category that contains the selected bag */}
                  {selectedGroup && cat.bags.some((b) => groupByBagId.get(b.id)?.groupId === selectedGroupId) && (
                    <DropsPanel group={selectedGroup} onClose={() => setSelectedGroupId(null)} />
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-text-muted text-sm">No loot bags match your search.</p>
              )}
            </div>
          </>
        ) : (
          /* Upgrade recipes */
          <div className="space-y-2">
            {(data?.upgrades ?? []).map((upgrade, i) => {
              const totalEU = upgrade.euPerTick * upgrade.duration;
              const seconds = upgrade.duration / 20;
              return (
                <div
                  key={i}
                  className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Input */}
                    <Link
                      prefetch={false}
                      href={`/items/${createReadableItemId(upgrade.input.id)}`}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Input</span>
                      <div className="item-slot w-12! h-12! group-hover:border-accent-primary/50 transition-colors relative">
                        <ItemIcon itemId={upgrade.input.id} displayName={upgrade.input.displayName} size={36} />
                        <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold text-accent-primary bg-bg-primary px-0.5 rounded">
                          {upgrade.input.amount}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary group-hover:text-accent-primary transition-colors text-center leading-tight max-w-[80px] truncate">
                        {upgrade.input.displayName.replace(/^LootBag \(/i, "").replace(/\)$/, "")}
                      </span>
                    </Link>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-accent-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>

                    {/* Output */}
                    <Link
                      prefetch={false}
                      href={`/items/${createReadableItemId(upgrade.output.id)}`}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-primary">Output</span>
                      <div className="item-slot w-12! h-12! group-hover:border-accent-primary/50 transition-colors">
                        <ItemIcon itemId={upgrade.output.id} displayName={upgrade.output.displayName} size={36} />
                      </div>
                      <span className="text-xs text-text-secondary group-hover:text-accent-primary transition-colors text-center leading-tight max-w-[80px] truncate">
                        {upgrade.output.displayName.replace(/^LootBag \(/i, "").replace(/\)$/, "")}
                      </span>
                    </Link>

                    {/* Stats */}
                    <div className="ml-auto flex flex-col gap-1 text-xs text-right">
                      <span className="text-text-muted">
                        <span className="text-accent-primary font-medium">{upgrade.euPerTick}</span> EU/t
                      </span>
                      <span className="text-text-muted">
                        <span className="text-text-secondary">{seconds}s</span>
                      </span>
                      <span className="text-text-muted">
                        Total: <span className="text-text-secondary">{formatEU(totalEU)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
