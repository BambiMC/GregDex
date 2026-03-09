"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createReadableItemId } from "@/lib/utils";
import { encodeId } from "@/lib/encoding";

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
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  const [productNames, setProductNames] = useState<Record<string, string>>({});

  // Format a product id into a brief name for display (last segment after colon)
  const getProductName = (id: string) => {
    // prefer fetched displayName if available
    if (productNames[id]) return productNames[id];
    // Remove numeric metadata at end (e.g. gregtech:gt.comb:49 -> gregtech:gt.comb)
    const parts = id.split(":");
    if (parts.length > 1 && /^[0-9]+$/.test(parts[parts.length - 1])) {
      parts.pop();
    }
    let last = parts[parts.length - 1] || id;
    // If last segment contains dots (namespace or subid), take final part
    const sub = last.split(".");
    last = sub[sub.length - 1] || last;
    return last;
  };

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

        // speciesId may be a readable uid (e.g. forestry.speciesForest) or
        // a legacy base64url-encoded value. Detect and decode if necessary.
        let uid: string;
        const looksLikeBase64 = /^[A-Za-z0-9-_]{8,}$/.test(speciesId) && !speciesId.includes(".") && !speciesId.includes(":");
        if (looksLikeBase64) {
          try {
            uid = atob(speciesId.replace(/-/g, "+").replace(/_/g, "/"));
          } catch {
            uid = speciesId;
          }
        } else {
          uid = speciesId;
        }

        const species = allSpecies.find((s) => s.uid === uid);
        if (!species) return;
        // Convert raw product/specialty maps into arrays that are easier to render.
        const toList = (map?: Record<string, number>) =>
          map
            ? Object.entries(map).map(([id, chance]) => ({ id, chance }))
            : [];
        const productList = toList((species as any).products);
        const specialtyList = toList((species as any).specialties);

        // After we found the species, attempt to locate a matching icon.
        // Icons live under `/icons/items/` and many start with `bee_`.
        const uidStr: string = species.uid;
        const candidates = [
          // exact uid
          `/icons/items/bee_${uidStr}.png`,
          `/icons/items/bee_${uidStr}_0.png`,
          `/icons/items/bee_${uidStr}.PNG`,
          `/icons/items/bee_${uidStr.replace(/\./g, "_")}.png`,
          // readable form
          `/icons/items/bee_${createReadableItemId(uidStr)}.png`,
          `/icons/items/bee_${createReadableItemId(uidStr)}_0.png`,
        ];

        // Try to find a working icon URL by preloading images sequentially
        async function findIcon() {
          for (const c of candidates) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await new Promise<boolean>((res) => {
              const img = new Image();
              img.onload = () => res(true);
              img.onerror = () => res(false);
              img.src = c;
            });
            if (ok) return c;
          }
          return null;
        }

        const found = await findIcon();
        if (found) setIconUrl(found);

        setData({
          species,
          mutations: {
            asOffspring: allMutations.filter((m) => m.offspringUid === uid),
            asParent1: allMutations.filter((m) => m.parent1Uid === uid),
            asParent2: allMutations.filter((m) => m.parent2Uid === uid),
          },
          productList,
          specialtyList,
        });

        // kick off name lookups for products
        const allIds = [...productList, ...specialtyList].map((p: any) => p.id);
        allIds.forEach((pid) => {
          if (!productNames[pid]) {
            const raw = pid.replace(/-/g, ":");
            const enc = encodeId(raw);
            fetch(`/data/items/${enc}.json`)
              .then((r) => r.ok ? r.json() : null)
              .then((item) => {
                if (item) {
                  setProductNames((prev) => ({ ...prev, [pid]: item.displayName }));
                }
              });
          }
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [speciesId]);

  // also trigger name fetch when data changes (in case state updated later)
  useEffect(() => {
    if (!data) return;
    const allIds = [...(data.productList || []), ...(data.specialtyList || [])].map((p: any) => p.id);
    allIds.forEach((pid) => {
      if (!productNames[pid]) {
        const raw = pid.replace(/-/g, ":");
        const enc = encodeId(raw);
        fetch(`/data/items/${enc}.json`)
          .then((r) => r.ok ? r.json() : null)
          .then((item) => {
            if (item) {
              setProductNames((prev) => ({ ...prev, [pid]: item.displayName }));
            }
          });
      }
    });
  }, [data]);
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

  const { species, mutations, productList = [], specialtyList = [] } = data;

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
            <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              {iconUrl ? (
                // Use plain img to avoid Next.js static-import requirements for dynamic paths
                // Images are served from `public/icons/items/`
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl} alt={getBeeDisplayName(species.uid)} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🐝</span>
              )}
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

        {/* Products & Specialties */}
        {(productList.length > 0 || specialtyList.length > 0) && (
          <div className="space-y-6 mb-6">
            {specialtyList.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-2">
                  Specialty Conditions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    Temp: {species.temperature}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    Humidity: {species.humidity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    {species.nocturnal ? "Nocturnal" : "Diurnal"}
                  </span>
                </div>
              </div>
            )}
            {productList.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  Products
                </h2>
                <div className="flex flex-wrap gap-2">
                  {productList.map((p: any, i: number) => (
                    <Link
                      key={i}
                      href={`/items/${createReadableItemId(p.id)}`}
                      className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-lg hover:border-border-bright transition-colors flex items-center gap-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {getProductName(p.id)}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {p.id}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full border border-accent-primary/20">
                        {(p.chance * 100).toFixed(0)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {specialtyList.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  Specialities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {specialtyList.map((p: any, i: number) => (
                    <Link
                      key={i}
                      href={`/items/${createReadableItemId(p.id)}`}
                      className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-lg hover:border-border-bright transition-colors flex items-center gap-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {getProductName(p.id)}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {p.id}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full border border-accent-primary/20">
                        {(p.chance * 100).toFixed(0)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                        href={`/bees/${createReadableItemId(mutation.parent1Uid)}`}
                        className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors"
                      >
                        <div className="text-sm font-medium text-yellow-400">
                          {getBeeDisplayName(mutation.parent1Uid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.parent1Uid}</div>
                      </Link>

                      <span className="text-text-muted text-lg">+</span>

                      <Link
                        href={`/bees/${createReadableItemId(mutation.parent2Uid)}`}
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
                        href={`/bees/${createReadableItemId(mutation.parent1Uid)}`}
                        className={`px-3 py-1.5 border rounded-lg hover:border-yellow-500/40 transition-colors ${mutation.parent1Uid === species.uid
                          ? "bg-accent-success/10 border-accent-success/20"
                          : "bg-yellow-500/10 border-yellow-500/20"
                          }`}
                      >
                        <div className={`text-sm font-medium ${mutation.parent1Uid === species.uid ? "text-accent-success" : "text-yellow-400"
                          }`}>
                          {getBeeDisplayName(mutation.parent1Uid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.parent1Uid}</div>
                      </Link>

                      <span className="text-text-muted text-lg">+</span>

                      <Link
                        href={`/bees/${createReadableItemId(mutation.parent2Uid)}`}
                        className={`px-3 py-1.5 border rounded-lg hover:border-yellow-500/40 transition-colors ${mutation.parent2Uid === species.uid
                          ? "bg-accent-success/10 border-accent-success/20"
                          : "bg-yellow-500/10 border-yellow-500/20"
                          }`}
                      >
                        <div className={`text-sm font-medium ${mutation.parent2Uid === species.uid ? "text-accent-success" : "text-yellow-400"
                          }`}>
                          {getBeeDisplayName(mutation.parent2Uid)}
                        </div>
                        <div className="text-[10px] text-text-muted">{mutation.parent2Uid}</div>
                      </Link>

                      <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>

                      <Link
                        href={`/bees/${createReadableItemId(mutation.offspringUid)}`}
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
