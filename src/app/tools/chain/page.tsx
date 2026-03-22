"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ItemIcon from "@/components/ItemIcon";
import { createReadableItemId } from "@/lib/utils";
import { encodeId } from "@/lib/encoding";
import {
  formatEU,
  formatTicks,
  getVoltageTier,
  getMachineDisplayName,
} from "@/lib/format";

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
  fluidInputs: {
    name: string;
    displayName: string;
    amount: number;
  }[];
  itemOutputs: { id: string; displayName: string; amount: number }[];
  fluidOutputs: {
    name: string;
    displayName: string;
    amount: number;
  }[];
}

interface TreeNode {
  id: string;
  displayName: string;
  amount: number;
  type: "item" | "fluid";
  recipe: Recipe | null;
  availableRecipes: Recipe[]; // all recipes that produce this item
  selectedRecipeIndex: number; // which recipe is currently selected
  children: TreeNode[];
  depth: number;
}

interface FlatMaterial {
  id: string;
  displayName: string;
  type: "item" | "fluid";
  amount: number;
}

// === Item search (reuses items-index.json) ===

let itemsCache: ItemIndex[] | null = null;
let itemsCachePromise: Promise<void> | null = null;

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

// === Data fetching helpers ===

const itemDataCache = new Map<string, any>();
const chunkCache = new Map<string, any[]>();

async function fetchItemData(itemId: string): Promise<any | null> {
  if (itemDataCache.has(itemId)) return itemDataCache.get(itemId);
  try {
    const encoded = encodeId(itemId);
    const res = await fetch(`/data/items/${encoded}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    itemDataCache.set(itemId, data);
    return data;
  } catch {
    return null;
  }
}

async function fetchRecipeChunk(
  machineId: string,
  chunk: number
): Promise<any[]> {
  const key = `${machineId}/chunk-${chunk}`;
  if (chunkCache.has(key)) return chunkCache.get(key)!;
  try {
    const res = await fetch(`/data/recipes/${key}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    chunkCache.set(key, data);
    return data;
  } catch {
    return [];
  }
}

const MAX_RECIPES_PER_ITEM = 10;

async function getAllRecipes(itemId: string): Promise<Recipe[]> {
  const item = await fetchItemData(itemId);
  if (!item || !item.recipesAsOutput || item.recipesAsOutput.length === 0)
    return [];

  const refs: RecipeRef[] = item.recipesAsOutput.slice(
    0,
    MAX_RECIPES_PER_ITEM
  );
  const recipes: Recipe[] = [];

  for (const ref of refs) {
    const chunk = await fetchRecipeChunk(ref.machine, ref.chunk);
    const recipe = chunk[ref.index] as Recipe | undefined;
    if (recipe) recipes.push(recipe);
  }

  return recipes;
}

// === Recursive tree builder ===

const MAX_DEPTH = 8;
const MAX_NODES = 200;

async function buildTree(
  itemId: string,
  displayName: string,
  amount: number,
  type: "item" | "fluid",
  depth: number,
  visited: Set<string>,
  nodeCount: { count: number },
  recipeChoices: Map<string, number> // itemId → chosen recipe index
): Promise<TreeNode> {
  const node: TreeNode = {
    id: itemId,
    displayName,
    amount,
    type,
    recipe: null,
    availableRecipes: [],
    selectedRecipeIndex: 0,
    children: [],
    depth,
  };

  // Stop conditions
  if (
    depth >= MAX_DEPTH ||
    nodeCount.count >= MAX_NODES ||
    type === "fluid" ||
    visited.has(itemId)
  ) {
    return node;
  }

  visited.add(itemId);
  nodeCount.count++;

  const allRecipes = await getAllRecipes(itemId);
  if (allRecipes.length === 0) {
    visited.delete(itemId);
    return node; // raw material
  }

  node.availableRecipes = allRecipes;
  const chosenIndex = recipeChoices.get(itemId) ?? 0;
  node.selectedRecipeIndex = Math.min(chosenIndex, allRecipes.length - 1);
  const recipe = allRecipes[node.selectedRecipeIndex];
  node.recipe = recipe;

  // Calculate multiplier: how many batches needed
  const outputAmount =
    recipe.itemOutputs.find((o) => o.id === itemId)?.amount || 1;
  const batches = Math.ceil(amount / outputAmount);

  // Recurse into item inputs
  for (const input of recipe.itemInputs) {
    if (!input) continue;
    const child = await buildTree(
      input.id,
      input.displayName,
      input.amount * batches,
      "item",
      depth + 1,
      visited,
      nodeCount,
      recipeChoices
    );
    node.children.push(child);
  }

  // Add fluid inputs as leaf nodes
  for (const fluid of recipe.fluidInputs) {
    node.children.push({
      id: fluid.name,
      displayName: fluid.displayName,
      amount: fluid.amount * batches,
      type: "fluid",
      recipe: null,
      availableRecipes: [],
      selectedRecipeIndex: 0,
      children: [],
      depth: depth + 1,
    });
  }

  visited.delete(itemId);
  return node;
}

// === Aggregate raw materials from tree ===

function collectRawMaterials(node: TreeNode): FlatMaterial[] {
  const map = new Map<string, FlatMaterial>();

  function walk(n: TreeNode) {
    if (!n.recipe && n.depth > 0) {
      const key = `${n.type}:${n.id}`;
      const existing = map.get(key);
      if (existing) {
        existing.amount += n.amount;
      } else {
        map.set(key, {
          id: n.id,
          displayName: n.displayName,
          type: n.type,
          amount: n.amount,
        });
      }
      return;
    }
    for (const child of n.children) {
      walk(child);
    }
  }

  walk(node);
  return Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

// === Aggregate intermediate steps ===

interface IntermediateStep {
  id: string;
  displayName: string;
  amount: number;
  machine: string;
  euPerTick?: number;
  duration?: number;
}

function collectIntermediates(node: TreeNode): IntermediateStep[] {
  const map = new Map<string, IntermediateStep>();

  function walk(n: TreeNode) {
    if (n.recipe && n.depth > 0) {
      const key = n.id;
      const existing = map.get(key);
      if (existing) {
        existing.amount += n.amount;
      } else {
        map.set(key, {
          id: n.id,
          displayName: n.displayName,
          amount: n.amount,
          machine: n.recipe.machine,
          euPerTick: n.recipe.euPerTick,
          duration: n.recipe.duration,
        });
      }
    }
    for (const child of n.children) {
      walk(child);
    }
  }

  walk(node);
  return Array.from(map.values());
}

// === Components ===

function ItemSearchInput({
  onSelect,
}: {
  onSelect: (item: ItemIndex) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemIndex[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      await loadItemsCache();
      const lower = query.toLowerCase();
      const matches = (itemsCache || [])
        .filter(
          (item) =>
            item.displayName.toLowerCase().includes(lower) ||
            item.id.toLowerCase().includes(lower)
        )
        .slice(0, 12);
      setResults(matches);
      setSelectedIdx(0);
      setOpen(true);
    }, 150);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item: ItemIndex) => {
    setQuery(item.displayName);
    setOpen(false);
    onSelect(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search for an item... (e.g. Electric Blast Furnace)"
        className="w-full px-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIdx
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <div className="item-slot !w-8 !h-8 shrink-0">
                <ItemIcon
                  itemId={item.id}
                  displayName={item.displayName}
                  size={28}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate">{item.displayName}</div>
                <div className="text-xs text-text-muted truncate">
                  {item.modId}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RecipePicker({
  node,
  onChangeRecipe,
}: {
  node: TreeNode;
  onChangeRecipe: (itemId: string, recipeIndex: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (node.availableRecipes.length <= 1) return null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/20 transition-colors cursor-pointer shrink-0"
        title="Choose alternative recipe"
      >
        {node.selectedRecipeIndex + 1}/{node.availableRecipes.length}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-bg-secondary border border-border-default rounded-lg shadow-xl overflow-hidden z-50 min-w-[260px] max-h-60 overflow-y-auto">
          {node.availableRecipes.map((recipe, i) => {
            const tier = recipe.euPerTick
              ? getVoltageTier(recipe.euPerTick)
              : null;
            const isSelected = i === node.selectedRecipeIndex;
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeRecipe(node.id, i);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-bg-elevated transition-colors flex items-center gap-2 ${
                  isSelected ? "bg-accent-primary/10" : ""
                }`}
              >
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                )}
                <span className="text-accent-secondary font-medium truncate">
                  {getMachineDisplayName(recipe.machine)}
                </span>
                {tier && (
                  <span
                    className="font-medium shrink-0"
                    style={{ color: tier.color }}
                  >
                    {tier.name}
                  </span>
                )}
                {recipe.euPerTick && (
                  <span className="text-text-muted shrink-0">
                    {recipe.euPerTick} EU/t
                  </span>
                )}
                {recipe.duration && (
                  <span className="text-text-muted shrink-0">
                    {formatTicks(recipe.duration)}
                  </span>
                )}
                {/* Show compact inputs */}
                <span className="text-text-muted ml-auto shrink-0">
                  {recipe.itemInputs.filter(Boolean).length +
                    recipe.fluidInputs.length}{" "}
                  in
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TreeNodeView({
  node,
  expanded,
  onToggle,
  onChangeRecipe,
}: {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  onChangeRecipe: (itemId: string, recipeIndex: number) => void;
}) {
  const nodeKey = `${node.depth}:${node.id}`;
  const isExpanded = expanded.has(nodeKey);
  const hasChildren = node.children.length > 0;
  const isRaw = !node.recipe && node.depth > 0;

  return (
    <div className="ml-4 border-l border-border-default">
      <div className="flex items-center gap-2 py-1 pl-3 -ml-px hover:bg-bg-elevated/50 rounded-r transition-colors">
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={() => onToggle(nodeKey)}
            className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <span className="w-4 h-4 flex items-center justify-center text-text-muted shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
          </span>
        )}

        {/* Icon */}
        {node.type === "item" ? (
          <Link
            prefetch={false}
            href={`/items/${createReadableItemId(node.id)}`}
          >
            <div className="item-slot !w-7 !h-7 shrink-0">
              <ItemIcon
                itemId={node.id}
                displayName={node.displayName}
                size={24}
              />
            </div>
          </Link>
        ) : (
          <div className="item-slot !w-7 !h-7 shrink-0 bg-accent-secondary/10 border-accent-secondary/30">
            <span className="text-[8px] text-accent-secondary">
              {node.displayName.substring(0, 2)}
            </span>
          </div>
        )}

        {/* Name + amount */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`text-sm truncate ${isRaw ? "text-accent-success font-medium" : "text-text-primary"}`}
          >
            {node.displayName}
          </span>
          <span className="text-xs text-text-muted shrink-0">
            x{node.amount}
            {node.type === "fluid" && "L"}
          </span>
        </div>

        {/* Recipe picker — shows when multiple recipes available */}
        <RecipePicker node={node} onChangeRecipe={onChangeRecipe} />

        {/* Machine badge */}
        {node.recipe && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted border border-border-default shrink-0">
            {getMachineDisplayName(node.recipe.machine)}
          </span>
        )}

        {isRaw && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-success/10 text-accent-success border border-accent-success/20 shrink-0">
            raw
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded &&
        node.children.map((child, i) => (
          <TreeNodeView
            key={`${child.id}-${i}`}
            node={child}
            expanded={expanded}
            onToggle={onToggle}
            onChangeRecipe={onChangeRecipe}
          />
        ))}
    </div>
  );
}

// === Main Page ===

export default function CraftingChainPage() {
  const [selectedItem, setSelectedItem] = useState<ItemIndex | null>(null);
  const [amount, setAmount] = useState("1");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"tree" | "materials" | "steps">(
    "materials"
  );
  // Track user's recipe choices per item ID
  const recipeChoices = useRef<Map<string, number>>(new Map());

  const amountValue = Math.max(1, Number(amount) || 1);

  const calculate = useCallback(async () => {
    if (!selectedItem) return;
    setLoading(true);
    setTree(null);

    try {
      const result = await buildTree(
        selectedItem.id,
        selectedItem.displayName,
        amountValue,
        "item",
        0,
        new Set(),
        { count: 0 },
        recipeChoices.current
      );
      setTree(result);

      // Auto-expand first two levels
      const autoExpand = new Set<string>();
      autoExpand.add(`0:${result.id}`);
      for (const child of result.children) {
        autoExpand.add(`1:${child.id}`);
      }
      setExpanded(autoExpand);
    } catch (err) {
      console.error("Error building crafting chain:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedItem, amountValue]);

  // When user changes recipe for a node, save choice and rebuild tree
  const handleChangeRecipe = useCallback(
    async (itemId: string, recipeIndex: number) => {
      recipeChoices.current.set(itemId, recipeIndex);
      // Rebuild the entire tree with updated choices
      if (!selectedItem) return;
      setLoading(true);
      try {
        const result = await buildTree(
          selectedItem.id,
          selectedItem.displayName,
          amountValue,
          "item",
          0,
          new Set(),
          { count: 0 },
          recipeChoices.current
        );
        setTree(result);
      } catch (err) {
        console.error("Error rebuilding crafting chain:", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedItem, amountValue]
  );

  const toggleNode = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!tree) return;
    const all = new Set<string>();
    function walk(n: TreeNode) {
      all.add(`${n.depth}:${n.id}`);
      for (const c of n.children) walk(c);
    }
    walk(tree);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  const rawMaterials = tree ? collectRawMaterials(tree) : [];
  const intermediates = tree ? collectIntermediates(tree) : [];
  const totalEU = intermediates.reduce((sum, step) => {
    if (step.euPerTick && step.duration) {
      const outputAmount = 1;
      const batches = Math.ceil(step.amount / outputAmount);
      return sum + step.euPerTick * step.duration * batches;
    }
    return sum;
  }, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <Link
            href="/"
            className="hover:text-text-secondary transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">Tools</span>
          <span>/</span>
          <span className="text-text-primary">Crafting Chain</span>
        </nav>

        <h1 className="text-2xl font-bold mb-1">Crafting Chain Calculator</h1>
        <p className="text-text-secondary text-sm mb-8">
          Recursively resolve an item&apos;s full crafting tree to see every raw
          material and intermediate step needed. Click the recipe counter on any
          node to choose an alternative recipe.
        </p>

        {/* Input Section */}
        <div className="bg-bg-tertiary border border-border-default rounded-lg p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Target Item
              </label>
              <ItemSearchInput onSelect={setSelectedItem} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Amount
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button
              onClick={calculate}
              disabled={!selectedItem || loading}
              className="px-6 py-2.5 bg-accent-primary text-bg-primary font-semibold text-sm rounded-lg hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                  Resolving...
                </span>
              ) : (
                "Calculate"
              )}
            </button>
          </div>

          {selectedItem && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-default">
              <div className="item-slot !w-10 !h-10">
                <ItemIcon
                  itemId={selectedItem.id}
                  displayName={selectedItem.displayName}
                  size={32}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {selectedItem.displayName}
                </div>
                <div className="text-xs text-text-muted">
                  {selectedItem.modId} &middot; {selectedItem.id}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {tree && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-accent-success">
                  {rawMaterials.length}
                </div>
                <div className="text-xs text-text-muted">Raw Materials</div>
              </div>
              <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-accent-secondary">
                  {intermediates.length}
                </div>
                <div className="text-xs text-text-muted">
                  Processing Steps
                </div>
              </div>
              <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-accent-primary">
                  {tree.children.length > 0
                    ? Math.max(...collectDepths(tree))
                    : 0}
                </div>
                <div className="text-xs text-text-muted">Chain Depth</div>
              </div>
              <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-accent-danger">
                  {totalEU > 0 ? formatEU(totalEU) : "N/A"}
                </div>
                <div className="text-xs text-text-muted">
                  Est. Total EU
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between mb-4 border-b border-border-default">
              <div className="flex gap-1">
                {(
                  [
                    { key: "materials", label: "Shopping List" },
                    { key: "steps", label: "Processing Steps" },
                    { key: "tree", label: "Dependency Tree" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
                      activeTab === tab.key
                        ? "border-accent-primary text-accent-primary"
                        : "border-transparent text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === "tree" && (
                <div className="flex gap-2 pb-2">
                  <button
                    onClick={expandAll}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    Expand all
                  </button>
                  <span className="text-text-muted">/</span>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    Collapse all
                  </button>
                </div>
              )}
            </div>

            {/* Shopping List Tab */}
            {activeTab === "materials" && (
              <div className="bg-bg-tertiary border border-border-default rounded-lg overflow-hidden">
                {rawMaterials.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm">
                    No raw materials — this item has no recipe or all inputs are
                    self-referencing.
                  </div>
                ) : (
                  <div className="divide-y divide-border-default">
                    {rawMaterials.map((mat) => (
                      <div
                        key={`${mat.type}:${mat.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-elevated transition-colors"
                      >
                        {mat.type === "item" ? (
                          <Link
                            prefetch={false}
                            href={`/items/${createReadableItemId(mat.id)}`}
                          >
                            <div className="item-slot !w-8 !h-8 shrink-0">
                              <ItemIcon
                                itemId={mat.id}
                                displayName={mat.displayName}
                                size={28}
                              />
                            </div>
                          </Link>
                        ) : (
                          <div className="item-slot !w-8 !h-8 shrink-0 bg-accent-secondary/10 border-accent-secondary/30">
                            <span className="text-[8px] text-accent-secondary">
                              {mat.displayName.substring(0, 2)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-text-primary truncate block">
                            {mat.displayName}
                          </span>
                        </div>
                        <span className="text-sm font-mono font-medium text-accent-primary shrink-0">
                          x{mat.amount}
                          {mat.type === "fluid" ? "L" : ""}
                        </span>
                        {mat.type === "fluid" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                            fluid
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Processing Steps Tab */}
            {activeTab === "steps" && (
              <div className="bg-bg-tertiary border border-border-default rounded-lg overflow-hidden">
                {intermediates.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm">
                    No processing steps — the item has no recipe chain.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-bg-secondary border-b border-border-default">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">
                            Item
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">
                            Machine
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-muted uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-muted uppercase">
                            EU/t
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-text-muted uppercase">
                            Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {intermediates.map((step) => {
                          const tier =
                            step.euPerTick
                              ? getVoltageTier(step.euPerTick)
                              : null;
                          return (
                            <tr
                              key={step.id}
                              className="hover:bg-bg-elevated transition-colors"
                            >
                              <td className="px-4 py-2">
                                <Link
                                  prefetch={false}
                                  href={`/items/${createReadableItemId(step.id)}`}
                                  className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                                >
                                  <div className="item-slot !w-7 !h-7 shrink-0">
                                    <ItemIcon
                                      itemId={step.id}
                                      displayName={step.displayName}
                                      size={24}
                                    />
                                  </div>
                                  <span className="truncate">
                                    {step.displayName}
                                  </span>
                                </Link>
                              </td>
                              <td className="px-4 py-2 text-text-secondary">
                                {getMachineDisplayName(step.machine)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-accent-primary">
                                x{step.amount}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {step.euPerTick ? (
                                  <span style={{ color: tier?.color }}>
                                    {step.euPerTick}
                                  </span>
                                ) : (
                                  <span className="text-text-muted">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-text-secondary font-mono text-xs">
                                {step.duration
                                  ? formatTicks(step.duration)
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tree Tab */}
            {activeTab === "tree" && (
              <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 overflow-x-auto">
                <TreeNodeView
                  node={tree}
                  expanded={expanded}
                  onToggle={toggleNode}
                  onChangeRecipe={handleChangeRecipe}
                />
              </div>
            )}

            {/* Depth/limit warnings */}
            <div className="mt-4 text-xs text-text-muted space-y-1">
              <p>
                Tree limited to {MAX_DEPTH} levels deep and {MAX_NODES} nodes.
                Circular references are detected and stopped.
              </p>
              <p>
                Click the purple recipe counter (e.g.{" "}
                <span className="text-accent-purple">1/3</span>) on any node to
                switch between alternative recipes.
              </p>
            </div>
          </>
        )}

        {/* Empty state */}
        {!tree && !loading && (
          <div className="text-center py-16 text-text-muted">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </svg>
            <p className="text-lg mb-2">Select an item to trace its crafting chain</p>
            <p className="text-sm">
              See the full dependency tree and raw material shopping list for any
              item in GTNH.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to collect max depths
function collectDepths(node: TreeNode): number[] {
  if (node.children.length === 0) return [node.depth];
  return node.children.flatMap((c) => collectDepths(c));
}
