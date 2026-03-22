"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ItemIcon from "@/components/ItemIcon";
import { encodeId } from "@/lib/encoding";
import { getMachineDisplayName, getVoltageTier } from "@/lib/format";

// === Constants ===

const VOLTAGE_TIERS = [
  { name: "ULV", voltage: 8 },
  { name: "LV", voltage: 32 },
  { name: "MV", voltage: 128 },
  { name: "HV", voltage: 512 },
  { name: "EV", voltage: 2048 },
  { name: "IV", voltage: 8192 },
  { name: "LuV", voltage: 32768 },
  { name: "ZPM", voltage: 131072 },
  { name: "UV", voltage: 524288 },
  { name: "UHV", voltage: 2097152 },
  { name: "UEV", voltage: 8388608 },
  { name: "UIV", voltage: 33554432 },
  { name: "UMV", voltage: 134217728 },
  { name: "UXV", voltage: 536870912 },
  { name: "MAX", voltage: 2147483648 },
] as const;

// === Types ===

interface ItemIndex {
  id: string;
  displayName: string;
  modId: string;
}

interface RecipeRef {
  machine: string;
  chunk: number;
  index: number;
}

interface Recipe {
  machine: string;
  recipeType: string;
  euPerTick?: number;
  duration?: number;
  itemInputs: ({ id: string; displayName: string; amount: number } | null)[];
  fluidInputs: { name: string; displayName: string; amount: number }[];
  itemOutputs: { id: string; displayName: string; amount: number }[];
  fluidOutputs: { name: string; displayName: string; amount: number }[];
}

interface ThroughputNode {
  id: string;
  displayName: string;
  ratePerSec: number;
  type: "item" | "fluid";
  recipe: Recipe | null;
  availableRecipes: Recipe[];
  selectedRecipeIndex: number;
  machinesNeeded: number;
  euDraw: number;
  overclockedEU: number;
  overclockedDurSecs: number;
  overclockLevels: number;
  children: ThroughputNode[];
  depth: number;
}

interface ProductionStep {
  id: string;
  displayName: string;
  ratePerSec: number;
  machine: string;
  machinesNeeded: number;
  euDraw: number;
  overclockedEU: number;
  overclockLevels: number;
}

interface RawMaterial {
  id: string;
  displayName: string;
  type: "item" | "fluid";
  ratePerSec: number;
}

// === Item search cache ===

let itemsCache: ItemIndex[] | null = null;
let itemsCachePromise: Promise<void> | null = null;

function loadItemsCache(): Promise<void> {
  if (itemsCache) return Promise.resolve();
  if (itemsCachePromise) return itemsCachePromise;
  itemsCachePromise = fetch("/data/items-index.json")
    .then((r) => r.json())
    .then((d) => { itemsCache = d; })
    .catch(() => { itemsCache = []; });
  return itemsCachePromise;
}

// === Data fetching ===

const itemDataCache = new Map<string, unknown>();
const chunkCache = new Map<string, unknown[]>();

async function fetchItemData(itemId: string): Promise<{ recipesAsOutput?: RecipeRef[] } | null> {
  if (itemDataCache.has(itemId)) return itemDataCache.get(itemId) as { recipesAsOutput?: RecipeRef[] };
  try {
    const encoded = encodeId(itemId);
    const res = await fetch(`/data/items/${encoded}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    itemDataCache.set(itemId, data);
    return data;
  } catch { return null; }
}

async function fetchRecipeChunk(machineId: string, chunk: number): Promise<unknown[]> {
  const key = `${machineId}/chunk-${chunk}`;
  if (chunkCache.has(key)) return chunkCache.get(key)!;
  try {
    const res = await fetch(`/data/recipes/${key}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    chunkCache.set(key, data);
    return data;
  } catch { return []; }
}

async function getAllRecipes(itemId: string): Promise<Recipe[]> {
  const item = await fetchItemData(itemId);
  if (!item?.recipesAsOutput?.length) return [];
  const refs = item.recipesAsOutput.slice(0, 10);
  const recipes: Recipe[] = [];
  for (const ref of refs) {
    const chunk = await fetchRecipeChunk(ref.machine, ref.chunk);
    const recipe = chunk[ref.index] as Recipe | undefined;
    if (recipe) recipes.push(recipe);
  }
  return recipes;
}

// === Overclock calculation ===

function getBaseTierIndex(euPerTick: number): number {
  for (let i = 0; i < VOLTAGE_TIERS.length; i++) {
    if (euPerTick <= VOLTAGE_TIERS[i].voltage) return i;
  }
  return VOLTAGE_TIERS.length - 1;
}

function calcOverclock(recipe: Recipe, targetTierIndex: number) {
  const baseEU = recipe.euPerTick || 0;
  const baseDurSecs = (recipe.duration || 1) / 20;
  if (!recipe.euPerTick || !recipe.duration) {
    return { overclockedEU: baseEU, overclockedDurSecs: baseDurSecs, overclockLevels: 0 };
  }
  const baseTierIdx = getBaseTierIndex(baseEU);
  const overclocks = Math.max(0, targetTierIndex - baseTierIdx);
  const overclockedDurSecs = Math.max(1 / 20, baseDurSecs / Math.pow(2, overclocks));
  const overclockedEU = baseEU * Math.pow(4, overclocks);
  return { overclockedEU, overclockedDurSecs, overclockLevels: overclocks };
}

// === Tree builder ===

const MAX_DEPTH = 8;
const MAX_NODES = 200;

async function buildTree(
  itemId: string,
  displayName: string,
  ratePerSec: number,
  type: "item" | "fluid",
  depth: number,
  visited: Set<string>,
  nodeCount: { count: number },
  recipeChoices: Map<string, number>,
  targetTierIndex: number
): Promise<ThroughputNode> {
  const node: ThroughputNode = {
    id: itemId, displayName, ratePerSec, type,
    recipe: null, availableRecipes: [], selectedRecipeIndex: 0,
    machinesNeeded: 0, euDraw: 0, overclockedEU: 0, overclockedDurSecs: 0, overclockLevels: 0,
    children: [], depth,
  };

  if (depth >= MAX_DEPTH || nodeCount.count >= MAX_NODES || type === "fluid" || visited.has(itemId)) {
    return node;
  }

  visited.add(itemId);
  nodeCount.count++;

  const allRecipes = await getAllRecipes(itemId);
  if (allRecipes.length === 0) {
    visited.delete(itemId);
    return node;
  }

  node.availableRecipes = allRecipes;
  const chosenIndex = recipeChoices.get(itemId) ?? 0;
  node.selectedRecipeIndex = Math.min(chosenIndex, allRecipes.length - 1);
  const recipe = allRecipes[node.selectedRecipeIndex];
  node.recipe = recipe;

  const { overclockedEU, overclockedDurSecs, overclockLevels } = calcOverclock(recipe, targetTierIndex);
  node.overclockedEU = overclockedEU;
  node.overclockedDurSecs = overclockedDurSecs;
  node.overclockLevels = overclockLevels;

  const outputAmount = recipe.itemOutputs.find((o) => o.id === itemId)?.amount || 1;
  const outputRatePerMachine = outputAmount / overclockedDurSecs;
  node.machinesNeeded = Math.ceil(ratePerSec / outputRatePerMachine);
  node.euDraw = node.machinesNeeded * overclockedEU;

  for (const input of recipe.itemInputs) {
    if (!input) continue;
    const inputRate = (node.machinesNeeded * input.amount) / overclockedDurSecs;
    const child = await buildTree(
      input.id, input.displayName, inputRate, "item",
      depth + 1, visited, nodeCount, recipeChoices, targetTierIndex
    );
    node.children.push(child);
  }

  for (const fluid of recipe.fluidInputs) {
    const fluidRate = (node.machinesNeeded * fluid.amount) / overclockedDurSecs;
    node.children.push({
      id: fluid.name, displayName: fluid.displayName, ratePerSec: fluidRate, type: "fluid",
      recipe: null, availableRecipes: [], selectedRecipeIndex: 0,
      machinesNeeded: 0, euDraw: 0, overclockedEU: 0, overclockedDurSecs: 0, overclockLevels: 0,
      children: [], depth: depth + 1,
    });
  }

  visited.delete(itemId);
  return node;
}

// === Aggregators ===

function collectRawMaterials(node: ThroughputNode): RawMaterial[] {
  const map = new Map<string, RawMaterial>();
  function walk(n: ThroughputNode) {
    if (!n.recipe && n.depth > 0) {
      const key = `${n.type}:${n.id}`;
      const ex = map.get(key);
      if (ex) ex.ratePerSec += n.ratePerSec;
      else map.set(key, { id: n.id, displayName: n.displayName, type: n.type, ratePerSec: n.ratePerSec });
      return;
    }
    for (const child of n.children) walk(child);
  }
  walk(node);
  return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function collectProductionSteps(node: ThroughputNode): ProductionStep[] {
  const map = new Map<string, ProductionStep>();
  function walk(n: ThroughputNode) {
    if (n.recipe) {
      const key = `${n.id}:${n.recipe.machine}`;
      const ex = map.get(key);
      if (ex) {
        ex.machinesNeeded += n.machinesNeeded;
        ex.euDraw += n.euDraw;
        ex.ratePerSec += n.ratePerSec;
      } else {
        map.set(key, {
          id: n.id, displayName: n.displayName, ratePerSec: n.ratePerSec,
          machine: n.recipe.machine, machinesNeeded: n.machinesNeeded,
          euDraw: n.euDraw, overclockedEU: n.overclockedEU, overclockLevels: n.overclockLevels,
        });
      }
    }
    for (const child of n.children) walk(child);
  }
  walk(node);
  return Array.from(map.values());
}

// === Format helpers ===

function formatRate(ratePerSec: number): string {
  if (ratePerSec >= 1) return `${ratePerSec.toFixed(2)}/s`;
  if (ratePerSec * 60 >= 0.1) return `${(ratePerSec * 60).toFixed(2)}/min`;
  return `${(ratePerSec * 3600).toFixed(1)}/hr`;
}

function formatRateRow(ratePerSec: number) {
  const fmt = (n: number) =>
    n < 0.001 ? n.toExponential(2) :
    n >= 10000 ? n.toLocaleString("en", { maximumFractionDigits: 0 }) :
    n >= 1 ? n.toFixed(2) : n.toFixed(4);
  return { perSec: fmt(ratePerSec), perMin: fmt(ratePerSec * 60), perHour: fmt(ratePerSec * 3600) };
}

// === ItemSearchInput ===

function ItemSearchInput({ onSelect }: { onSelect: (item: ItemIndex) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemIndex[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      await loadItemsCache();
      const lower = query.toLowerCase();
      const matches = (itemsCache || [])
        .filter((item) => item.displayName.toLowerCase().includes(lower) || item.id.toLowerCase().includes(lower))
        .slice(0, 12);
      setResults(matches);
      setSelectedIdx(0);
      setOpen(true);
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item: ItemIndex) => {
    setQuery(item.displayName);
    setOpen(false);
    onSelect(item);
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter" && results[selectedIdx]) { e.preventDefault(); handleSelect(results[selectedIdx]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search for an item to produce..."
        className="w-full px-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded-lg shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto">
          {results.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIdx ? "bg-accent-primary/10 text-accent-primary" : "text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <div className="item-slot !w-8 !h-8 shrink-0">
                <ItemIcon itemId={item.id} displayName={item.displayName} size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate">{item.displayName}</div>
                <div className="text-xs text-text-muted truncate">{item.modId}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// === Main page ===

export default function ThroughputPage() {
  const [targetItem, setTargetItem] = useState<ItemIndex | null>(null);
  const [targetRate, setTargetRate] = useState(10);
  const [timeUnit, setTimeUnit] = useState<"second" | "minute" | "hour">("minute");
  const [targetTierIndex, setTargetTierIndex] = useState(3); // HV default
  const [tree, setTree] = useState<ThroughputNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "materials" | "power">("steps");
  const recipeChoices = useRef<Map<string, number>>(new Map());

  const targetRatePerSec =
    timeUnit === "second" ? targetRate :
    timeUnit === "minute" ? targetRate / 60 :
    targetRate / 3600;

  const calculate = useCallback(async (
    item: ItemIndex,
    ratePerSec: number,
    tierIndex: number,
    choices: Map<string, number>
  ) => {
    setLoading(true);
    setTree(null);
    try {
      const result = await buildTree(
        item.id, item.displayName, ratePerSec, "item",
        0, new Set(), { count: 0 }, choices, tierIndex
      );
      setTree(result);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCalculate = useCallback(() => {
    if (!targetItem) return;
    calculate(targetItem, targetRatePerSec, targetTierIndex, recipeChoices.current);
  }, [targetItem, targetRatePerSec, targetTierIndex, calculate]);

  const steps = tree ? collectProductionSteps(tree) : [];
  const rawMats = tree ? collectRawMaterials(tree) : [];
  const totalEU = steps.reduce((s, step) => s + step.euDraw, 0);
  const totalMachines = steps.reduce((s, step) => s + step.machinesNeeded, 0);

  const euByMachine = new Map<string, { eu: number; machines: number }>();
  for (const step of steps) {
    const ex = euByMachine.get(step.machine);
    if (ex) { ex.eu += step.euDraw; ex.machines += step.machinesNeeded; }
    else euByMachine.set(step.machine, { eu: step.euDraw, machines: step.machinesNeeded });
  }
  const powerBreakdown = Array.from(euByMachine.entries())
    .map(([machine, { eu, machines }]) => ({ machine, eu, machines, pct: totalEU > 0 ? (eu / totalEU) * 100 : 0 }))
    .sort((a, b) => b.eu - a.eu);

  const suggestedTier = totalEU > 0 ? getVoltageTier(totalEU) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link prefetch={false} href="/" className="hover:text-text-secondary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-text-secondary">Tools</span>
          <span>/</span>
          <span className="text-text-primary font-medium">Throughput Calculator</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-1">Throughput Calculator</h1>
        <p className="text-text-secondary text-sm mb-6">
          Set a target output rate and find out how many machines you need, their total EU/t draw, and raw material supply rates.
        </p>

        {/* Controls */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 mb-6 space-y-4">
          {/* Row 1: item + rate */}
          <div className="flex flex-wrap items-center gap-3">
            <ItemSearchInput onSelect={setTargetItem} />
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={0.001}
                step={1}
                value={targetRate}
                onChange={(e) => setTargetRate(Math.max(0.001, parseFloat(e.target.value) || 1))}
                className="w-24 px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors text-right"
              />
              <span className="text-text-muted text-sm shrink-0">per</span>
              <select
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value as typeof timeUnit)}
                className="px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
              >
                <option value="second">second</option>
                <option value="minute">minute</option>
                <option value="hour">hour</option>
              </select>
            </div>
          </div>

          {/* Row 2: tier + calculate */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-text-muted shrink-0">Target tier:</span>
            <div className="flex flex-wrap gap-1">
              {VOLTAGE_TIERS.map((tier, i) => {
                const tierData = getVoltageTier(tier.voltage);
                const isActive = targetTierIndex === i;
                return (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => setTargetTierIndex(i)}
                    className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors cursor-pointer ${
                      isActive ? "border-current" : "border-border-default text-text-muted hover:border-current"
                    }`}
                    style={{
                      color: isActive ? tierData.color : undefined,
                      backgroundColor: isActive ? `${tierData.color}18` : undefined,
                    }}
                  >
                    {tier.name}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={!targetItem || loading}
              className="ml-auto px-4 py-2 text-sm font-semibold rounded-lg bg-accent-primary/15 border border-accent-primary/40 text-accent-primary hover:bg-accent-primary/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Calculating…" : "Calculate"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            <span className="text-text-muted text-sm">Building production chain…</span>
          </div>
        )}

        {/* Results */}
        {tree && !loading && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-bg-secondary border border-border-default rounded-lg px-4 py-3">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Total EU/t</div>
                <div className="text-lg font-bold text-accent-primary">
                  {totalEU > 0 ? `${totalEU.toLocaleString()} EU/t` : "—"}
                </div>
                {suggestedTier && (
                  <div className="text-xs mt-0.5 font-medium" style={{ color: suggestedTier.color }}>
                    {suggestedTier.name} power needed
                  </div>
                )}
              </div>
              <div className="bg-bg-secondary border border-border-default rounded-lg px-4 py-3">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Machines</div>
                <div className="text-lg font-bold text-accent-secondary">{totalMachines}</div>
                <div className="text-xs text-text-muted mt-0.5">{steps.length} distinct step{steps.length !== 1 ? "s" : ""}</div>
              </div>
              <div className="bg-bg-secondary border border-border-default rounded-lg px-4 py-3">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Raw Materials</div>
                <div className="text-lg font-bold text-accent-success">{rawMats.length}</div>
                <div className="text-xs text-text-muted mt-0.5">distinct inputs</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-border-default">
              {(["steps", "materials", "power"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-accent-primary text-accent-primary"
                      : "border-transparent text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {tab === "steps" ? `Production Steps (${steps.length})` : tab === "materials" ? `Raw Materials (${rawMats.length})` : "Power Summary"}
                </button>
              ))}
            </div>

            {/* Production Steps */}
            {activeTab === "steps" && (
              <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary border-b border-border-default">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Item</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Machine</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-muted uppercase tracking-wider"># Machines</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Output Rate</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">EU/t Draw</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">OC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {steps.map((step, i) => {
                      const tier = step.overclockedEU > 0 ? getVoltageTier(step.overclockedEU) : null;
                      return (
                        <tr key={i} className="hover:bg-bg-elevated transition-colors">
                          <td className="px-4 py-2.5 font-medium text-text-primary">{step.displayName}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-accent-secondary text-xs">{getMachineDisplayName(step.machine)}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-text-primary text-sm">{step.machinesNeeded}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-accent-primary">{formatRate(step.ratePerSec)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs">
                            {step.euDraw > 0 ? (
                              <span style={{ color: tier?.color }}>{step.euDraw.toLocaleString()} EU/t</span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-text-muted">
                            {step.overclockLevels > 0 ? `+${step.overclockLevels}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {steps.length === 0 && (
                  <div className="py-8 text-center text-text-muted text-sm">No production steps found</div>
                )}
              </div>
            )}

            {/* Raw Materials */}
            {activeTab === "materials" && (
              <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary border-b border-border-default">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Material</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Per Second</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Per Minute</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Per Hour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {rawMats.map((mat, i) => {
                      const rates = formatRateRow(mat.ratePerSec);
                      const unit = mat.type === "fluid" ? " mB" : "";
                      return (
                        <tr key={i} className="hover:bg-bg-elevated transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {mat.type === "item" && (
                                <div className="item-slot !w-6 !h-6 shrink-0">
                                  <ItemIcon itemId={mat.id} displayName={mat.displayName} size={20} showTooltip={false} />
                                </div>
                              )}
                              <span className={mat.type === "fluid" ? "text-accent-secondary" : "text-text-primary"}>
                                {mat.displayName}
                              </span>
                              {mat.type === "fluid" && (
                                <span className="text-[10px] text-accent-secondary/50">fluid</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">{rates.perSec}{unit}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs font-medium text-accent-primary">{rates.perMin}{unit}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">{rates.perHour}{unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rawMats.length === 0 && (
                  <div className="py-8 text-center text-text-muted text-sm">No raw materials found</div>
                )}
              </div>
            )}

            {/* Power Summary */}
            {activeTab === "power" && (
              <div className="space-y-4">
                <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Total Power Consumption</h3>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-accent-primary">
                      {totalEU > 0 ? totalEU.toLocaleString() : "0"}
                    </span>
                    <span className="text-text-secondary text-sm">EU/t</span>
                    {suggestedTier && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded ml-1"
                        style={{ color: suggestedTier.color, backgroundColor: `${suggestedTier.color}18` }}
                      >
                        {suggestedTier.name} tier
                      </span>
                    )}
                  </div>
                  {totalEU > 0 && (
                    <div className="text-xs text-text-muted space-x-3">
                      <span>{(totalEU * 20).toLocaleString()} EU/s</span>
                      <span>{((totalEU * 20 * 3600) / 1_000_000).toFixed(1)}M EU/hr</span>
                    </div>
                  )}
                </div>

                {powerBreakdown.length > 0 && (
                  <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-default text-xs font-semibold text-text-muted uppercase tracking-wider">
                      EU/t by Machine Type
                    </div>
                    <div className="divide-y divide-border-default">
                      {powerBreakdown.map(({ machine, eu, machines, pct }) => {
                        const tier = eu > 0 ? getVoltageTier(eu / Math.max(1, machines)) : null;
                        return (
                          <div key={machine} className="px-4 py-3 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-text-primary truncate">{getMachineDisplayName(machine)}</span>
                                <span className="text-xs text-text-muted ml-2 shrink-0">{machines} machine{machines !== 1 ? "s" : ""}</span>
                              </div>
                              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: tier?.color || "var(--color-accent-primary)" }}
                                />
                              </div>
                            </div>
                            <div className="text-right shrink-0 w-28">
                              <div
                                className="text-sm font-mono font-semibold"
                                style={{ color: tier?.color }}
                              >
                                {eu.toLocaleString()} EU/t
                              </div>
                              <div className="text-xs text-text-muted">{pct.toFixed(1)}%</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!tree && !loading && (
          <div className="text-center py-16 text-text-muted">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">
              Search for an item, set a production rate, pick a target tier, and click{" "}
              <span className="text-accent-primary font-medium">Calculate</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
