"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

export default function BeeSpeciesDetailPage({
  params,
}: {
  params: Promise<{ speciesId: string }>;
}) {
  const { speciesId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [speciesRes, mutationsRes] = await Promise.all([
          fetch("/data/bee-species.json"),
          fetch("/data/bee-mutations.json"),
        ]);
        if (!speciesRes.ok || !mutationsRes.ok) return;
        const allSpecies: any[] = await speciesRes.json();
        const allMutations: any[] = await mutationsRes.json();

        // speciesId is base64url-encoded uid
        let uid: string;
        try {
          uid = atob(speciesId.replace(/-/g, "+").replace(/_/g, "/"));
        } catch {
          uid = speciesId;
        }

        const species = allSpecies.find((s) => s.uid === uid);
        if (!species) return;

        setData({
          species,
          mutations: {
            asOffspring: allMutations.filter((m) => m.offspringUid === uid),
            asParent1: allMutations.filter((m) => m.parent1Uid === uid),
            asParent2: allMutations.filter((m) => m.parent2Uid === uid),
          },
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [speciesId]);

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

  if (!data?.species) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Bee Species Not Found
        </h1>
        <Link href="/bees" className="text-accent-secondary hover:underline">
          Back to Bee Breeding
        </Link>
      </div>
    );
  }

  const { species, mutations } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/bees" className="hover:text-accent-secondary">
            Bee Breeding
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{getBeeDisplayName(species.uid)}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-2xl">🐝</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">
                {getBeeDisplayName(species.uid)}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  Bee Species
                </span>
                <span className="text-xs text-text-muted font-mono">
                  {species.uid}
                </span>
              </div>
              {species.binomial && (
                <div className="mt-2">
                  <span className="text-sm text-text-muted italic">
                    {species.binomial}
                  </span>
                </div>
              )}
              {species.branch && (
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    {species.branch}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mutations */}
        <div className="space-y-6">
          {/* As Offspring */}
          {mutations.asOffspring.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                How to Breed This Species
              </h2>
              <div className="space-y-2">
                {mutations.asOffspring.map((mutation: any, i: number) => (
                  <div
                    key={i}
                    className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/bees/${encodeId(mutation.parent1Uid)}`}
                        className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
                      >
                        <div className="text-sm font-medium text-yellow-400">
                          {getBeeDisplayName(mutation.parent1Uid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.parent1Uid}</div>
                      </Link>

                      <span className="text-text-muted text-lg">+</span>

                      <Link
                        href={`/bees/${encodeId(mutation.parent2Uid)}`}
                        className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
                      >
                        <div className="text-sm font-medium text-yellow-400">
                          {getBeeDisplayName(mutation.parent2Uid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.parent2Uid}</div>
                      </Link>

                      <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>

                      <div className="px-3 py-1.5 bg-accent-success/10 border border-accent-success/20 rounded-lg">
                        <div className="text-sm font-medium text-accent-success">
                          {getBeeDisplayName(mutation.offspringUid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.offspringUid}</div>
                      </div>

                      <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full border border-accent-primary/20">
                        {mutation.chance}%
                      </span>
                    </div>

                    {mutation.conditions && mutation.conditions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mutation.conditions.map((cond: string, j: number) => (
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
              </div>
            </div>
          )}

          {/* As Parent */}
          {(mutations.asParent1.length > 0 || mutations.asParent2.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                Breeding Results With This Species
              </h2>
              <div className="space-y-2">
                {[...mutations.asParent1, ...mutations.asParent2].map((mutation: any, i: number) => (
                  <div
                    key={i}
                    className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/bees/${encodeId(mutation.parent1Uid)}`}
                        className={`px-3 py-1.5 border rounded-lg hover:border-yellow-500/40 transition-colors ${
                          mutation.parent1Uid === species.uid
                            ? "bg-accent-success/10 border-accent-success/20"
                            : "bg-yellow-500/10 border-yellow-500/20"
                        }`}
                      >
                        <div className={`text-sm font-medium ${
                          mutation.parent1Uid === species.uid ? "text-accent-success" : "text-yellow-400"
                        }`}>
                          {getBeeDisplayName(mutation.parent1Uid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.parent1Uid}</div>
                      </Link>

                      <span className="text-text-muted text-lg">+</span>

                      <Link
                        href={`/bees/${encodeId(mutation.parent2Uid)}`}
                        className={`px-3 py-1.5 border rounded-lg hover:border-yellow-500/40 transition-colors ${
                          mutation.parent2Uid === species.uid
                            ? "bg-accent-success/10 border-accent-success/20"
                            : "bg-yellow-500/10 border-yellow-500/20"
                        }`}
                      >
                        <div className={`text-sm font-medium ${
                          mutation.parent2Uid === species.uid ? "text-accent-success" : "text-yellow-400"
                        }`}>
                          {getBeeDisplayName(mutation.parent2Uid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.parent2Uid}</div>
                      </Link>

                      <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>

                      <Link
                        href={`/bees/${encodeId(mutation.offspringUid)}`}
                        className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
                      >
                        <div className="text-sm font-medium text-yellow-400">
                          {getBeeDisplayName(mutation.offspringUid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.offspringUid}</div>
                      </Link>

                      <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full border border-accent-primary/20">
                        {mutation.chance}%
                      </span>
                    </div>

                    {mutation.conditions && mutation.conditions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mutation.conditions.map((cond: string, j: number) => (
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
              </div>
            </div>
          )}

          {/* No mutations */}
          {mutations.asOffspring.length === 0 &&
           mutations.asParent1.length === 0 &&
           mutations.asParent2.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              This species is not involved in any known breeding mutations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
