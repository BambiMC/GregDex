"use client";

import { useState, useEffect, useMemo } from "react";

interface Mutation {
  parent1Uid: string;
  parent1Name: string;
  parent2Uid: string;
  parent2Name: string;
  offspringUid: string;
  offspringName: string;
  chance: number;
  conditions?: string[];
}

function getBeeDisplayName(uid: string): string {
  // Extract clean name from uid like "forestry.speciesRural" -> "Rural"
  const parts = uid.split(".");
  let name = parts[parts.length - 1];
  // Remove "species" prefix
  name = name.replace(/^species/i, "");
  // Add spaces before capitals
  return name.replace(/([a-z])([A-Z])/g, "$1 $2") || uid;
}

export default function BeesPage() {
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/bees?type=mutations")
      .then((r) => r.json())
      .then((d) => setMutations(d.mutations || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return mutations;
    const q = search.toLowerCase();
    return mutations.filter(
      (m) =>
        getBeeDisplayName(m.parent1Uid).toLowerCase().includes(q) ||
        getBeeDisplayName(m.parent2Uid).toLowerCase().includes(q) ||
        getBeeDisplayName(m.offspringUid).toLowerCase().includes(q) ||
        m.parent1Uid.toLowerCase().includes(q) ||
        m.parent2Uid.toLowerCase().includes(q) ||
        m.offspringUid.toLowerCase().includes(q)
    );
  }, [mutations, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Bee Breeding</h1>
        <p className="text-text-secondary text-sm mb-6">
          {mutations.length} known mutations
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mutations by species name..."
          className="w-full max-w-md px-4 py-2 mb-6 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 200).map((mutation, i) => (
              <div
                key={i}
                className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Parent 1 */}
                  <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-sm font-medium text-yellow-400">
                      {getBeeDisplayName(mutation.parent1Uid)}
                    </div>
                    <div className="text-[10px] text-text-muted">{mutation.parent1Uid}</div>
                  </div>

                  <span className="text-text-muted text-lg">+</span>

                  {/* Parent 2 */}
                  <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-sm font-medium text-yellow-400">
                      {getBeeDisplayName(mutation.parent2Uid)}
                    </div>
                    <div className="text-[10px] text-text-muted">{mutation.parent2Uid}</div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>

                  {/* Offspring */}
                  <div className="px-3 py-1.5 bg-accent-success/10 border border-accent-success/20 rounded-lg">
                    <div className="text-sm font-medium text-accent-success">
                      {getBeeDisplayName(mutation.offspringUid)}
                    </div>
                    <div className="text-[10px] text-text-muted">{mutation.offspringUid}</div>
                  </div>

                  {/* Chance */}
                  <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full border border-accent-primary/20">
                    {mutation.chance}%
                  </span>
                </div>

                {/* Conditions */}
                {mutation.conditions && mutation.conditions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mutation.conditions.map((cond, j) => (
                      <span
                        key={j}
                        className="text-xs text-accent-danger bg-accent-danger/10 px-2 py-0.5 rounded border border-accent-danger/20"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filtered.length > 200 && (
              <p className="text-center text-text-muted text-sm py-4">
                Showing first 200 of {filtered.length} mutations
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
