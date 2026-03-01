"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import RecipeCard from "@/components/recipes/RecipeCard";

export default function MachineDetailPage({
  params,
}: {
  params: Promise<{ machineId: string }>;
}) {
  const { machineId } = use(params);
  const decodedId = decodeURIComponent(machineId);

  const [machine, setMachine] = useState<any>(null);
  const [chunkData, setChunkData] = useState<any[]>([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Load machine metadata once
  useEffect(() => {
    fetch("/data/machines.json")
      .then((r) => r.json())
      .then((machines: any[]) => {
        const found = machines.find((m) => m.id === decodedId);
        setMachine(found || null);
      })
      .catch(() => setMachine(null));
  }, [decodedId]);

  // Load chunk when machine or chunk index changes
  const loadChunk = useCallback(
    async (chunkIndex: number) => {
      if (!decodedId) return;
      setLoading(true);
      try {
        const r = await fetch(
          `/data/recipes/${encodeURIComponent(decodedId)}/chunk-${chunkIndex}.json`,
        );
        if (r.ok) {
          setChunkData(await r.json());
        } else {
          setChunkData([]);
        }
      } catch {
        setChunkData([]);
      } finally {
        setLoading(false);
      }
    },
    [decodedId],
  );

  useEffect(() => {
    if (machine) {
      loadChunk(currentChunk);
    }
  }, [machine, currentChunk, loadChunk]);

  const filteredRecipes =
    search.length >= 2
      ? chunkData.filter((recipe) => {
          const lower = search.toLowerCase();
          return (
            recipe.itemOutputs?.some((o: any) =>
              o?.displayName?.toLowerCase().includes(lower),
            ) ||
            recipe.itemInputs?.some((i: any) =>
              i?.displayName?.toLowerCase().includes(lower),
            ) ||
            recipe.fluidOutputs?.some((o: any) =>
              o?.displayName?.toLowerCase().includes(lower),
            ) ||
            recipe.fluidInputs?.some((i: any) =>
              i?.displayName?.toLowerCase().includes(lower),
            )
          );
        })
      : chunkData;

  const totalChunks = machine?.chunks || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/machines" className="hover:text-accent-secondary">
            Machines
          </Link>
          <span>/</span>
          <span className="text-text-secondary">
            {machine?.displayName || decodedId}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-1">
          {machine?.displayName || decodedId}
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          {machine?.recipeCount?.toLocaleString() || "..."} recipes
        </p>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes in this batch..."
            className="w-full max-w-md px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {/* Recipes */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-bg-tertiary rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe: any, i: number) => (
              <RecipeCard key={`${currentChunk}-${i}`} recipe={recipe} />
            ))}
            {filteredRecipes.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                No recipes found
              </div>
            )}
          </div>
        )}

        {/* Chunk pagination */}
        {totalChunks > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => {
                setCurrentChunk(Math.max(0, currentChunk - 1));
                setSearch("");
              }}
              disabled={currentChunk === 0}
              className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">
              Batch {currentChunk + 1} of {totalChunks}
            </span>
            <button
              onClick={() => {
                setCurrentChunk(Math.min(totalChunks - 1, currentChunk + 1));
                setSearch("");
              }}
              disabled={currentChunk === totalChunks - 1}
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
