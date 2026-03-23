"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ItemIcon from "@/components/ItemIcon";
import {
  getMachineDisplayName,
  getVoltageTier,
  formatTicks,
  formatEU,
} from "@/lib/format";
import { encodeId } from "@/lib/encoding";
import type { RecipeData } from "./types";

interface ItemIndex {
  id: string;
  displayName: string;
  modId: string;
}

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

const chunkCache = new Map<string, unknown[]>();

async function fetchRecipeChunk(
  machineId: string,
  chunk: number
): Promise<unknown[]> {
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

interface Props {
  onSelect: (recipe: RecipeData, label: string) => void;
  onClose: () => void;
}

export default function RecipeSearchModal({ onSelect, onClose }: Props) {
  const [step, setStep] = useState<"search" | "pick">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemIndex[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemIndex | null>(null);
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Search items
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
        // Prefer specific meta variants over wildcard :32767
        .sort((a, b) => {
          const aWild = a.id.endsWith(":32767");
          const bWild = b.id.endsWith(":32767");
          if (aWild && !bWild) return 1;
          if (!aWild && bWild) return -1;
          return 0;
        })
        .slice(0, 15);
      setResults(matches);
    }, 150);
    return () => clearTimeout(timeout);
  }, [query]);

  // Load recipes for selected item
  const loadRecipes = useCallback(async (item: ItemIndex) => {
    setSelectedItem(item);
    setStep("pick");
    setLoadingRecipes(true);

    try {
      let itemId = item.id;
      let encoded = encodeId(itemId);
      let res = await fetch(`/data/items/${encoded}.json`);
      if (!res.ok) {
        setRecipes([]);
        return;
      }
      let data = await res.json();

      // If wildcard meta (:32767) has no output recipes, try the :0 variant
      if ((!data.recipesAsOutput || data.recipesAsOutput.length === 0) && itemId.endsWith(":32767")) {
        const altId = itemId.slice(0, -6) + ":0";
        const altEncoded = encodeId(altId);
        const altRes = await fetch(`/data/items/${altEncoded}.json`);
        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.recipesAsOutput?.length > 0) {
            data = altData;
          }
        }
      }

      // Load output recipes
      const refs = data.recipesAsOutput || [];
      const chunkKeys = new Set<string>();
      for (const ref of refs) {
        chunkKeys.add(`${ref.machine}/chunk-${ref.chunk}`);
      }

      const chunkMap = new Map<string, unknown[]>();
      await Promise.all(
        Array.from(chunkKeys).map(async (key) => {
          const [machineId, chunkPart] = key.split("/chunk-");
          const chunk = await fetchRecipeChunk(machineId, parseInt(chunkPart));
          if (chunk.length > 0) chunkMap.set(key, chunk);
        })
      );

      const loaded: RecipeData[] = [];
      for (const ref of refs) {
        const key = `${ref.machine}/chunk-${ref.chunk}`;
        const chunk = chunkMap.get(key);
        if (chunk && chunk[ref.index]) {
          loaded.push(chunk[ref.index] as RecipeData);
        }
      }

      setRecipes(loaded);
    } catch {
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-0 bg-black/60" />
      <div className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-[101]">
        <div className="bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0">
            <div className="flex items-center gap-2">
              {step === "pick" && (
                <button
                  onClick={() => {
                    setStep("search");
                    setSelectedItem(null);
                    setRecipes([]);
                  }}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <span className="text-sm font-medium text-text-primary">
                {step === "search"
                  ? "Search for an item"
                  : `Pick a recipe for ${selectedItem?.displayName}`}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Step 1: Item search */}
          {step === "search" && (
            <>
              <div className="px-4 py-3 border-b border-border-default">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type item name..."
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {results.length > 0 ? (
                  <div className="py-1">
                    {results.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadRecipes(item)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-bg-elevated transition-colors"
                      >
                        <div className="item-slot !w-8 !h-8 shrink-0">
                          <ItemIcon
                            itemId={item.id}
                            displayName={item.displayName}
                            size={28}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-text-primary">
                            {item.displayName}
                          </div>
                          <div className="text-xs text-text-muted truncate">
                            {item.modId}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : query.length >= 2 ? (
                  <div className="py-8 text-center text-text-muted text-sm">
                    No items found
                  </div>
                ) : (
                  <div className="py-8 text-center text-text-muted text-sm">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 2: Recipe picker */}
          {step === "pick" && (
            <div className="overflow-y-auto flex-1">
              {loadingRecipes ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-2" />
                  <div className="text-sm text-text-muted">
                    Loading recipes...
                  </div>
                </div>
              ) : recipes.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-sm">
                  No recipes found for this item
                </div>
              ) : (
                <div className="divide-y divide-border-default">
                  {recipes.map((recipe, i) => {
                    const tier = recipe.euPerTick
                      ? getVoltageTier(recipe.euPerTick)
                      : null;
                    const totalEU =
                      recipe.euPerTick && recipe.duration
                        ? recipe.euPerTick * recipe.duration
                        : 0;

                    return (
                      <button
                        key={i}
                        onClick={() =>
                          onSelect(
                            recipe,
                            `${getMachineDisplayName(recipe.machine)}: ${selectedItem?.displayName || "?"}`
                          )
                        }
                        className="w-full px-4 py-3 text-left hover:bg-bg-elevated transition-colors"
                      >
                        {/* Machine + stats */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-accent-secondary">
                            {getMachineDisplayName(recipe.machine)}
                          </span>
                          {tier && (
                            <div className="flex items-center gap-2 text-[10px]">
                              <span
                                style={{ color: tier.color }}
                                className="font-medium"
                              >
                                {tier.name}
                              </span>
                              <span className="text-text-muted">
                                {recipe.euPerTick} EU/t
                              </span>
                              <span className="text-text-muted">
                                {recipe.duration
                                  ? formatTicks(recipe.duration)
                                  : ""}
                              </span>
                              {totalEU > 0 && (
                                <span className="text-accent-danger">
                                  {formatEU(totalEU)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Inputs → Outputs */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex flex-wrap gap-1">
                            {recipe.itemInputs
                              .filter(
                                (x): x is NonNullable<typeof x> => x !== null
                              )
                              .map((input, j) => (
                                <div
                                  key={j}
                                  className="item-slot !w-7 !h-7"
                                  title={`${input.displayName} x${input.amount}`}
                                >
                                  <ItemIcon
                                    itemId={input.id}
                                    displayName={input.displayName}
                                    size={22}
                                    showTooltip={false}
                                  />
                                  {input.amount > 1 && (
                                    <span className="absolute -bottom-0.5 -right-0.5 text-[7px] font-bold text-accent-primary bg-bg-primary px-0.5 rounded">
                                      {input.amount}
                                    </span>
                                  )}
                                </div>
                              ))}
                            {recipe.fluidInputs.map((fluid, j) => (
                              <div
                                key={`f${j}`}
                                className="item-slot !w-7 !h-7 bg-accent-secondary/10 border-accent-secondary/30"
                                title={`${fluid.displayName} ${fluid.amount}L`}
                              >
                                <span className="text-[7px] text-accent-secondary">
                                  {fluid.displayName.substring(0, 2)}
                                </span>
                                <span className="absolute -bottom-0.5 -right-0.5 text-[6px] font-bold text-accent-secondary bg-bg-primary px-0.5 rounded">
                                  {fluid.amount}L
                                </span>
                              </div>
                            ))}
                          </div>

                          <svg
                            className="w-4 h-4 text-text-muted shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>

                          <div className="flex flex-wrap gap-1">
                            {recipe.itemOutputs.map((output, j) => (
                              <div
                                key={j}
                                className="item-slot !w-7 !h-7"
                                title={`${output.displayName} x${output.amount}`}
                              >
                                <ItemIcon
                                  itemId={output.id}
                                  displayName={output.displayName}
                                  size={22}
                                  showTooltip={false}
                                />
                                {output.amount > 1 && (
                                  <span className="absolute -bottom-0.5 -right-0.5 text-[7px] font-bold text-accent-primary bg-bg-primary px-0.5 rounded">
                                    {output.amount}
                                  </span>
                                )}
                              </div>
                            ))}
                            {recipe.fluidOutputs.map((fluid, j) => (
                              <div
                                key={`f${j}`}
                                className="item-slot !w-7 !h-7 bg-accent-secondary/10 border-accent-secondary/30"
                                title={`${fluid.displayName} ${fluid.amount}L`}
                              >
                                <span className="text-[7px] text-accent-secondary">
                                  {fluid.displayName.substring(0, 2)}
                                </span>
                                <span className="absolute -bottom-0.5 -right-0.5 text-[6px] font-bold text-accent-secondary bg-bg-primary px-0.5 rounded">
                                  {fluid.amount}L
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
