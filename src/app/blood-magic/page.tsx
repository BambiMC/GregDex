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
              <div
                key={i}
                className="h-20 bg-bg-tertiary rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : tab === "altar" ? (
          <div className="space-y-2">
            {altar.map((recipe, i) => (
              <div
                key={i}
                className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Input */}
                  <Link
                    href={`/items/${createReadableItemId(recipe.input.id)}`}
                  >
                    <div className="item-slot !w-10 !h-10 group/slot">
                      <ItemIcon
                        itemId={recipe.input.id}
                        displayName={recipe.input.displayName}
                        size={32}
                      />
                    </div>
                  </Link>
                  <Link
                    href={`/items/${createReadableItemId(recipe.input.id)}`}
                    className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
                  >
                    {recipe.input.displayName}
                  </Link>

                  <svg
                    className="w-5 h-5 text-text-muted"
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

                  {/* Output */}
                  <Link
                    href={`/items/${createReadableItemId(recipe.output.id)}`}
                  >
                    <div className="item-slot !w-10 !h-10 group/slot">
                      <ItemIcon
                        itemId={recipe.output.id}
                        displayName={recipe.output.displayName}
                        size={32}
                      />
                    </div>
                  </Link>
                  <Link
                    href={`/items/${createReadableItemId(recipe.output.id)}`}
                    className="text-sm font-medium text-text-primary hover:text-accent-primary transition-colors"
                  >
                    {recipe.output.displayName}
                  </Link>
                </div>

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-muted">
                  <span>
                    Tier{" "}
                    <span className="text-accent-danger font-medium">
                      {TIER_NAMES[recipe.minTier] || recipe.minTier}
                    </span>
                  </span>
                  <span>
                    LP:{" "}
                    <span className="text-accent-danger">
                      {recipe.liquidRequired.toLocaleString()}
                    </span>
                  </span>
                  <span>Consumption: {recipe.consumptionRate}/t</span>
                  <span>Drain: {recipe.drainRate}/t</span>
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
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/items/${createReadableItemId(recipe.output.id)}`}
                  >
                    <div className="item-slot !w-8 !h-8 group/slot">
                      <ItemIcon
                        itemId={recipe.output.id}
                        displayName={recipe.output.displayName}
                        size={28}
                      />
                    </div>
                  </Link>
                  <Link
                    href={`/items/${createReadableItemId(recipe.output.id)}`}
                    className="text-sm font-medium text-text-primary hover:text-accent-primary transition-colors"
                  >
                    {recipe.output.displayName}
                  </Link>
                  {recipe.output.amount > 1 && (
                    <span className="text-xs text-accent-primary">
                      x{recipe.output.amount}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 bg-accent-danger/10 text-accent-danger rounded border border-accent-danger/20">
                    Orb Level {recipe.orbLevel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recipe.inputs.map((input, j) => (
                    <Link
                      key={j}
                      href={`/items/${createReadableItemId(input.id)}`}
                    >
                      <div className="item-slot !w-8 !h-8 group/slot">
                        <ItemIcon
                          itemId={input.id}
                          displayName={input.displayName}
                          size={28}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
