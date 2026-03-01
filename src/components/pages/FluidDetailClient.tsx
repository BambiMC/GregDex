"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import RecipeCard from "@/components/recipes/RecipeCard";
import SaveButton from "@/components/ui/SaveButton";
import { useUserData } from "@/hooks/useUserData";
import { useVersion } from "@/contexts/VersionContext";

export default function FluidDetailPage({
  params,
}: {
  params: Promise<{ fluidId: string }>;
}) {
  const { fluidId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"output" | "input">("output");
  const { addToHistory } = useUserData();
  const { currentVersion } = useVersion();

  useEffect(() => {
    async function load() {
      try {
        const [fluidsRes, recipeIndexRes] = await Promise.all([
          fetch("/data/fluids-index.json"),
          fetch("/data/fluids-recipe-index.json"),
        ]);
        if (!fluidsRes.ok) return;
        const allFluids: { name: string; displayName: string }[] = await fluidsRes.json();
        const fluid = allFluids.find(
          (f) => f.name.replace(/\./g, "-") === fluidId || f.name === fluidId,
        );
        if (!fluid) return;

        const recipeIndex = recipeIndexRes.ok ? await recipeIndexRes.json() : {};
        const refs = recipeIndex[fluid.name] || { recipesAsOutput: [], recipesAsInput: [] };
        const MAX = 50;
        const outputRefs = refs.recipesAsOutput.slice(0, MAX);
        const inputRefs = refs.recipesAsInput.slice(0, MAX);

        // Fetch needed chunks in parallel
        const chunkKeys = new Set<string>();
        for (const ref of [...outputRefs, ...inputRefs]) {
          chunkKeys.add(`${ref.machine}/chunk-${ref.chunk}`);
        }
        const chunkMap = new Map<string, any[]>();
        await Promise.all(
          Array.from(chunkKeys).map(async (key) => {
            try {
              const res = await fetch(`/data/recipes/${key}.json`);
              if (res.ok) chunkMap.set(key, await res.json());
            } catch { /* ignore */ }
          }),
        );

        const getRecipe = (ref: any) =>
          chunkMap.get(`${ref.machine}/chunk-${ref.chunk}`)?.[ref.index];

        const outputRecipes = outputRefs.map(getRecipe).filter(Boolean);
        const inputRecipes = inputRefs.map(getRecipe).filter(Boolean);

        setData({
          fluid,
          outputRecipes,
          inputRecipes,
          totalOutputRecipes: refs.recipesAsOutput.length,
          totalInputRecipes: refs.recipesAsInput.length,
        });

        addToHistory({
          id: fluid.name,
          type: "fluid",
          displayName: fluid.displayName,
          version: currentVersion,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fluidId, addToHistory, currentVersion]);

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

  if (!data?.fluid) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Fluid Not Found
        </h1>
        <Link
          href="/fluids-gases"
          className="text-accent-secondary hover:underline"
        >
          Back to Fluids & Gases
        </Link>
      </div>
    );
  }

  const {
    fluid,
    outputRecipes = [],
    inputRecipes = [],
    totalOutputRecipes = 0,
    totalInputRecipes = 0,
  } = data || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/fluids-gases" className="hover:text-accent-secondary">
            Fluids & Gases
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{fluid.displayName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="item-slot !w-12 !h-12 shrink-0">
                <div className="w-full h-full bg-bg-secondary rounded border border-border-default flex items-center justify-center">
                  <span className="text-xs text-text-muted font-mono">💧</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {fluid.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    Fluid
                  </span>
                  <span className="text-xs text-text-muted font-mono">
                    {fluid.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Save button */}
            <SaveButton
              id={fluid.name}
              type="fluid"
              displayName={fluid.displayName}
              version={currentVersion}
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
                No recipes produce this fluid
              </div>
            ))}

          {activeTab === "input" &&
            (inputRecipes.length > 0 ? (
              inputRecipes.map((recipe: any, i: number) => (
                <RecipeCard key={i} recipe={recipe} />
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">
                This fluid is not used in any recipes
              </div>
            ))}
        </div>

        {/* Show more hint */}
        {activeTab === "output" && totalOutputRecipes > 50 && (
          <p className="text-center text-text-muted text-sm mt-4">
            Showing first 50 of {totalOutputRecipes} recipes
          </p>
        )}
        {activeTab === "input" && totalInputRecipes > 50 && (
          <p className="text-center text-text-muted text-sm mt-4">
            Showing first 50 of {totalInputRecipes} uses
          </p>
        )}
      </div>
    </div>
  );
}
