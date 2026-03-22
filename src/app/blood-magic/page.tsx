"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ItemIcon from "@/components/ItemIcon";
import { createReadableItemId } from "@/lib/utils";

interface AltarRecipe {
  input: { id: string; displayName: string; amount: number };
  output: { id: string; displayName: string; amount: number };
  minTier: number;
  liquidRequired: number;
  consumptionRate: number;
  drainRate: number;
}

interface AlchemyRecipe {
  output: { id: string; displayName: string; amount: number };
  orbLevel: number;
  inputs: { id: string; displayName: string; amount: number }[];
}

const TIER_NAMES = ["", "I", "II", "III", "IV", "V", "VI"];

function ItemTile({
  item,
  label,
  labelColor = "text-text-muted",
}: {
  item: { id: string; displayName: string; amount?: number };
  label: string;
  labelColor?: string;
}) {
  return (
    <Link
      prefetch={false}
      href={`/items/${createReadableItemId(item.id)}`}
      className="flex flex-col items-center gap-1 group"
    >
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${labelColor}`}>
        {label}
      </span>
      <div className="item-slot w-12! h-12! group-hover:border-accent-primary/50 transition-colors relative">
        <ItemIcon itemId={item.id} displayName={item.displayName} size={36} />
        {item.amount != null && item.amount > 1 && (
          <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold text-accent-primary bg-bg-primary px-0.5 rounded">
            {item.amount}
          </span>
        )}
      </div>
      <span className="text-xs text-text-secondary group-hover:text-accent-primary transition-colors text-center leading-tight max-w-[72px] truncate">
        {item.displayName}
      </span>
    </Link>
  );
}

export default function BloodMagicPage() {
  const [altar, setAltar] = useState<AltarRecipe[]>([]);
  const [alchemy, setAlchemy] = useState<AlchemyRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"altar" | "alchemy">("altar");

  useEffect(() => {
    fetch("/data/blood-magic.json")
      .then((r) => r.json())
      .then((d) => {
        setAltar(d.altarRecipes || []);
        setAlchemy(d.alchemyRecipes || []);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Blood Magic</h1>
        <p className="text-text-secondary text-sm mb-6">
          {altar.length} altar recipes, {alchemy.length} alchemy recipes
        </p>

        <div className="flex gap-1 mb-6">
          <button
            type="button"
            onClick={() => setTab("altar")}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              tab === "altar"
                ? "bg-accent-danger/15 text-accent-danger border border-accent-danger/30"
                : "bg-bg-tertiary text-text-muted border border-border-default"
            }`}
          >
            Altar ({altar.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("alchemy")}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              tab === "alchemy"
                ? "bg-accent-danger/15 text-accent-danger border border-accent-danger/30"
                : "bg-bg-tertiary text-text-muted border border-border-default"
            }`}
          >
            Alchemy ({alchemy.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tab === "altar" ? (
          <div className="space-y-2">
            {altar.map((recipe, i) => (
              <div
                key={i}
                className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Input */}
                  <ItemTile item={recipe.input} label="Input" labelColor="text-text-muted" />

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-accent-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>

                  {/* Output */}
                  <ItemTile item={recipe.output} label="Output" labelColor="text-accent-danger" />

                  {/* Stats */}
                  <div className="ml-auto flex flex-col gap-1 text-xs text-right">
                    <span className="text-text-muted">
                      Tier <span className="text-accent-danger font-semibold">{TIER_NAMES[recipe.minTier] || recipe.minTier}</span>
                    </span>
                    <span className="text-text-muted">
                      <span className="text-accent-danger font-medium">{recipe.liquidRequired.toLocaleString()}</span> LP
                    </span>
                    <span className="text-text-muted">{recipe.consumptionRate}/t · drain {recipe.drainRate}/t</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {alchemy.map((recipe, i) => (
              <div
                key={i}
                className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Inputs */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Inputs</span>
                    <div className="flex flex-wrap gap-1">
                      {recipe.inputs.map((input, j) => (
                        <Link
                          prefetch={false}
                          key={j}
                          href={`/items/${createReadableItemId(input.id)}`}
                          className="group"
                        >
                          <div className="item-slot w-10! h-10! group-hover:border-accent-primary/50 transition-colors relative">
                            <ItemIcon itemId={input.id} displayName={input.displayName} size={28} />
                            {input.amount > 1 && (
                              <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold text-accent-primary bg-bg-primary px-0.5 rounded">
                                {input.amount}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center self-center">
                    <svg className="w-5 h-5 text-accent-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>

                  {/* Output */}
                  <ItemTile
                    item={recipe.output}
                    label="Output"
                    labelColor="text-accent-danger"
                  />

                  {/* Orb level */}
                  <div className="ml-auto self-center">
                    <span className="text-xs px-2 py-1 bg-accent-danger/10 text-accent-danger rounded border border-accent-danger/20">
                      Orb Level {recipe.orbLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
