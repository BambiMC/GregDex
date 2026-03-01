"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import RecipeCard from "@/components/recipes/RecipeCard";
import ItemIcon from "@/components/ItemIcon";
import SaveButton from "@/components/ui/SaveButton";
import { useUserData } from "@/hooks/useUserData";
import { useVersion } from "@/contexts/VersionContext";

function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function parseReadableItemId(readableId: string): string {
  return readableId.replace(/-/g, ":");
}

const MAX_RECIPES = 50;

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"output" | "input">("output");
  const { addToHistory } = useUserData();
  const { currentVersion } = useVersion();

  useEffect(() => {
    async function load() {
      try {
        const rawId = parseReadableItemId(decodeURIComponent(itemId));
        const encodedId = encodeId(rawId);
        const itemRes = await fetch(`/data/items/${encodedId}.json`);
        if (!itemRes.ok) return;
        const item = await itemRes.json();

        // Collect unique chunks needed (limit to first MAX_RECIPES refs each)
        const outputRefs: any[] = (item.recipesAsOutput || []).slice(0, MAX_RECIPES);
        const inputRefs: any[] = (item.recipesAsInput || []).slice(0, MAX_RECIPES);

        const chunkKeys = new Set<string>();
        for (const ref of [...outputRefs, ...inputRefs]) {
          chunkKeys.add(`${ref.machine}/chunk-${ref.chunk}`);
        }

        // Fetch all needed chunks in parallel
        const chunkMap = new Map<string, any[]>();
        await Promise.all(
          Array.from(chunkKeys).map(async (key) => {
            try {
              const r = await fetch(`/data/recipes/${key}.json`);
              if (r.ok) chunkMap.set(key, await r.json());
            } catch {
              // ignore missing chunks
            }
          }),
        );

        const getRecipe = (ref: any) =>
          chunkMap.get(`${ref.machine}/chunk-${ref.chunk}`)?.[ref.index];

        const outputRecipes = outputRefs.map(getRecipe).filter(Boolean);
        const inputRecipes = inputRefs.map(getRecipe).filter(Boolean);

        setData({
          item,
          outputRecipes,
          inputRecipes,
          totalOutputRecipes: (item.recipesAsOutput || []).length,
          totalInputRecipes: (item.recipesAsInput || []).length,
        });

        if (item) {
          addToHistory({
            id: item.id,
            type: "item",
            displayName: item.displayName,
            version: currentVersion,
            metadata: { modId: item.modId },
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [itemId, addToHistory, currentVersion]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-bg-tertiary rounded animate-pulse mb-4" />
          <div className="h-64 bg-bg-tertiary rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data?.item) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Item Not Found
        </h1>
        <Link href="/items" className="text-accent-secondary hover:underline">
          Back to Items
        </Link>
      </div>
    );
  }

  const {
    item,
    outputRecipes,
    inputRecipes,
    totalOutputRecipes,
    totalInputRecipes,
  } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/items" className="hover:text-accent-secondary">
            Items
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{item.displayName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="item-slot !w-12 !h-12 shrink-0">
                <ItemIcon
                  itemId={item.id}
                  displayName={item.displayName}
                  size={40}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {item.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    {item.modId}
                  </span>
                  <span className="text-xs text-text-muted font-mono">
                    {item.id}
                  </span>
                </div>
                {item.oreDictNames && item.oreDictNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.oreDictNames.map((name: string) => (
                      <span
                        key={name}
                        className="px-2 py-0.5 rounded text-xs bg-accent-purple/10 text-accent-purple border border-accent-purple/20"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <SaveButton
              id={item.id}
              type="item"
              displayName={item.displayName}
              version={currentVersion}
              metadata={{
                modId: item.modId,
              }}
            />
          </div>
        </div>

        {/* Recipe Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border-default">
          <button
            onClick={() => setActiveTab("output")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "output"
                ? "border-accent-primary text-accent-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Recipes ({totalOutputRecipes})
          </button>
          <button
            onClick={() => setActiveTab("input")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "input"
                ? "border-accent-primary text-accent-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            Used In ({totalInputRecipes})
          </button>
        </div>

        {/* Recipe List */}
        <div className="space-y-3">
          {activeTab === "output" &&
            (outputRecipes.length > 0 ? (
              outputRecipes.map((recipe: any, i: number) => (
                <RecipeCard key={i} recipe={recipe} />
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">
                No recipes produce this item
              </div>
            ))}

          {activeTab === "input" &&
            (inputRecipes.length > 0 ? (
              inputRecipes.map((recipe: any, i: number) => (
                <RecipeCard key={i} recipe={recipe} />
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">
                This item is not used in any recipes
              </div>
            ))}
        </div>

        {/* Show more hint */}
        {activeTab === "output" && totalOutputRecipes > MAX_RECIPES && (
          <p className="text-center text-text-muted text-sm mt-4">
            Showing first {MAX_RECIPES} of {totalOutputRecipes} recipes
          </p>
        )}
        {activeTab === "input" && totalInputRecipes > MAX_RECIPES && (
          <p className="text-center text-text-muted text-sm mt-4">
            Showing first {MAX_RECIPES} of {totalInputRecipes} uses
          </p>
        )}
      </div>
    </div>
  );
}
