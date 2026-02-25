"use client";

import { useState, useEffect, use, useMemo } from "react";
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
  const [search, setSearch] = useState("");
  const { addToHistory } = useUserData();
  const { currentVersion } = useVersion();

  useEffect(() => {
    async function load() {
      try {
        // Convert the URL-friendly fluidId back to the actual fluid name
        const actualFluidName = fluidId.replace(/-/g, ".");
        const res = await fetch(`/api/fluids/${actualFluidName}`);
        if (res.ok) {
          const fluidData = await res.json();
          setData(fluidData);
          
          // Add to view history
          if (fluidData.fluid) {
            addToHistory({
              id: fluidData.fluid.name,
              type: 'fluid',
              displayName: fluidData.fluid.displayName,
              version: currentVersion,
            });
          }
        }
      } catch (error) {
        console.error("Error loading fluid:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fluidId, addToHistory, currentVersion]);

  const filteredRecipes = useMemo(() => {
    if (!data?.recipes || !search) {
      return data?.recipes || [];
    }

    const query = search.toLowerCase();
    const filtered = data.recipes.filter((recipe: any) => {
      // Search in machine name
      const machineMatch = recipe.machine?.toLowerCase().includes(query);

      // Search in item inputs/outputs (both ID and displayName)
      const itemMatch =
        recipe.itemInputs?.some(
          (item: any) =>
            item.displayName?.toLowerCase().includes(query) ||
            item.id?.toLowerCase().includes(query),
        ) ||
        recipe.itemOutputs?.some(
          (item: any) =>
            item.displayName?.toLowerCase().includes(query) ||
            item.id?.toLowerCase().includes(query),
        );

      // Search in fluid inputs/outputs (both ID and displayName)
      const fluidMatch =
        recipe.fluidInputs?.some(
          (fluid: any) =>
            fluid.displayName?.toLowerCase().includes(query) ||
            fluid.id?.toLowerCase().includes(query) ||
            fluid.name?.toLowerCase().includes(query),
        ) ||
        recipe.fluidOutputs?.some(
          (fluid: any) =>
            fluid.displayName?.toLowerCase().includes(query) ||
            fluid.id?.toLowerCase().includes(query) ||
            fluid.name?.toLowerCase().includes(query),
        );

      return machineMatch || itemMatch || fluidMatch;
    });
    return filtered;
  }, [data?.recipes, search]);

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
        <p className="text-text-muted mb-4">
          The fluid "{fluidId}" could not be found.
        </p>
        <Link
          href="/fluids-gases"
          className="text-accent-primary hover:text-accent-secondary"
        >
          ← Back to Fluids & Gases
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/fluids-gases"
            className="text-accent-primary hover:text-accent-secondary mb-4 inline-block"
          >
            ← Back to Fluids & Gases
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {data.fluid.displayName}
              </h1>
              <p className="text-text-muted font-mono text-sm">
                Internal ID: {data.fluid.name}
              </p>
            </div>
            
            {/* Save button */}
            <SaveButton
              id={data.fluid.name}
              type="fluid"
              displayName={data.fluid.displayName}
              version={currentVersion}
            />
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Fluid Information</h2>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {data.fluid.displayName}
            </p>
            <p>
              <strong>Internal Name:</strong> {data.fluid.name}
            </p>
            <p>
              <strong>Total Recipes:</strong>{" "}
              {data.totalRecipes.toLocaleString()}
            </p>
          </div>
        </div>

        {data.recipes && data.recipes.length > 0 && (
          <div className="bg-bg-secondary rounded-lg p-6 mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Recipes Using {data.fluid.displayName}
                <span className="text-sm font-normal text-text-muted ml-2">
                  ({data.recipes.length.toLocaleString()} recipes)
                </span>
              </h2>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes by machine, item/fluid names, or IDs..."
                className="w-full max-w-md px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
              />

              {search && (
                <p className="text-text-muted text-sm mt-2">
                  Found {filteredRecipes.length.toLocaleString()} matching
                  recipes
                </p>
              )}
            </div>

            <div className="space-y-4">
              {(search ? filteredRecipes : data.recipes.slice(0, 50)).map(
                (recipe: any, index: number) => (
                  <RecipeCard
                    key={`${recipe.machine}-${index}`}
                    recipe={recipe}
                  />
                ),
              )}
            </div>

            {!search && data.recipes.length > 50 && (
              <div className="mt-6 text-center text-text-muted text-sm bg-bg-tertiary rounded-lg p-4 border border-border-default">
                Showing first 50 of {data.recipes.length.toLocaleString()}{" "}
                recipes
              </div>
            )}

            {search && filteredRecipes.length === 0 && (
              <div className="mt-6 text-center text-text-muted text-sm bg-bg-tertiary rounded-lg p-4 border border-border-default">
                No recipes found matching "{search}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
