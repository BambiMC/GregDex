"use client";

import Link from "next/link";
import { formatEU, formatTicks, getVoltageTier, getMachineDisplayName } from "@/lib/format";
import ItemIcon from "@/components/ItemIcon";

function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function ItemSlot({ item }: { item: { id: string; displayName: string; amount: number } | null }) {
  if (!item) {
    return <div className="item-slot !w-10 !h-10 opacity-30" />;
  }
  return (
    <Link href={`/items/${encodeId(item.id)}`} title={item.displayName}>
      <div className="item-slot !w-10 !h-10 group/slot relative">
        <ItemIcon itemId={item.id} displayName={item.displayName} size={32} />
        {item.amount > 1 && (
          <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold text-accent-primary bg-bg-primary px-0.5 rounded">
            {item.amount}
          </span>
        )}
      </div>
    </Link>
  );
}

function FluidSlot({ fluid }: { fluid: { name: string; displayName: string; amount: number } }) {
  return (
    <div
      className="item-slot !w-10 !h-10 bg-accent-secondary/10 border-accent-secondary/30"
      title={`${fluid.displayName} (${fluid.amount}L)`}
    >
      <span className="text-[9px] text-accent-secondary">
        {fluid.displayName.substring(0, 2)}
      </span>
      <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-accent-secondary bg-bg-primary px-0.5 rounded">
        {fluid.amount}L
      </span>
    </div>
  );
}

function CraftingGrid({ recipe }: { recipe: any }) {
  const width = recipe.gridWidth || 3;
  const height = recipe.gridHeight || 3;
  const inputs = recipe.itemInputs || [];

  return (
    <div
      className="inline-grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${width}, 40px)`,
        gridTemplateRows: `repeat(${height}, 40px)`,
      }}
    >
      {Array.from({ length: width * height }).map((_, i) => (
        <ItemSlot key={i} item={inputs[i] || null} />
      ))}
    </div>
  );
}

export default function RecipeCard({ recipe }: { recipe: any }) {
  const isGtMachine = recipe.recipeType === "gt_machine";
  const isCrafting = recipe.machine === "crafting_table";
  const tier = isGtMachine && recipe.euPerTick ? getVoltageTier(recipe.euPerTick) : null;
  const totalEU = isGtMachine && recipe.euPerTick && recipe.duration
    ? recipe.euPerTick * recipe.duration
    : 0;

  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors">
      {/* Machine header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-default">
        <Link
          href={`/machines/${encodeURIComponent(recipe.machine)}`}
          className="text-sm font-medium text-accent-secondary hover:underline"
        >
          {getMachineDisplayName(recipe.machine)}
        </Link>
        {tier && (
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: tier.color }} className="font-medium">
              {tier.name}
            </span>
            <span className="text-text-muted">
              {recipe.euPerTick} EU/t
            </span>
            <span className="text-text-muted">
              {formatTicks(recipe.duration)}
            </span>
            <span className="text-accent-danger text-[10px]">
              {formatEU(totalEU)}
            </span>
          </div>
        )}
      </div>

      {/* Recipe content */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Inputs */}
        <div className="flex flex-col gap-2">
          {isCrafting ? (
            <CraftingGrid recipe={recipe} />
          ) : (
            <div className="flex flex-wrap gap-1">
              {(recipe.itemInputs || [])
                .filter((i: any) => i !== null)
                .map((input: any, idx: number) => (
                  <ItemSlot key={idx} item={input} />
                ))}
            </div>
          )}
          {recipe.fluidInputs?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.fluidInputs.map((fluid: any, idx: number) => (
                <FluidSlot key={idx} fluid={fluid} />
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="recipe-arrow select-none px-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>

        {/* Outputs */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {(recipe.itemOutputs || []).map((output: any, idx: number) => (
              <ItemSlot key={idx} item={output} />
            ))}
          </div>
          {recipe.fluidOutputs?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.fluidOutputs.map((fluid: any, idx: number) => (
                <FluidSlot key={idx} fluid={fluid} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
