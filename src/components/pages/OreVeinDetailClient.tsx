"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

function getVeinDisplayName(vein: any): string {
  return vein.primaryOre?.materialName || vein.name.replace(/^ore\.\w+\./, "");
}

function veinSlug(name: string) {
  return name.replace(/\./g, "-");
}

function OreIcon({ meta, displayName }: { meta: number; displayName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-2xl">⛏️</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/items/gregtech_gt.blockores_${meta}.png`}
      alt={displayName}
      width={40}
      height={40}
      className="pixelated"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export default function OreVeinDetailPage({
  params,
}: {
  params: Promise<{ veinId: string }>;
}) {
  const { veinId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [veinsRes, smallOresRes] = await Promise.all([
          fetch("/data/ore-veins.json"),
          fetch("/data/small-ores.json"),
        ]);
        if (!veinsRes.ok || !smallOresRes.ok) return;
        const allVeins: any[] = await veinsRes.json();
        const allSmallOres: any[] = await smallOresRes.json();

        // veinId is the vein name with dots replaced by hyphens
        const name = veinId.replace(/-/g, ".");

        const vein = allVeins.find((v) => v.name === name) || null;
        const smallOre = allSmallOres.find((o) => o.name === name) || null;

        if (!vein && !smallOre) return;

        const dims = vein ? vein.dimensions : smallOre.dimensions;
        setData({
          vein,
          smallOre,
          relatedVeins: allVeins.filter(
            (v) => v.name !== name && v.dimensions?.some((d: string) => dims.includes(d)),
          ),
          relatedSmallOres: allSmallOres.filter(
            (o) => o.name !== name && o.dimensions?.some((d: string) => dims.includes(d)),
          ),
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [veinId]);

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

  if (!data?.vein && !data?.smallOre) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Ore Vein Not Found
        </h1>
        <Link prefetch={false} href="/ores" className="text-accent-secondary hover:underline">
          Back to Ore Veins
        </Link>
      </div>
    );
  }

  const { vein, smallOre, relatedVeins, relatedSmallOres } = data;
  const maxY = 256;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link prefetch={false} href="/ores" className="hover:text-accent-secondary">
            Ore Veins
          </Link>
          <span>/</span>
          <span className="text-text-secondary">
            {vein ? getVeinDisplayName(vein) : smallOre.ore.materialName}
          </span>
        </div>

        {/* Header */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center shrink-0">
              {vein ? (
                <OreIcon meta={vein.primaryOre.meta} displayName={vein.primaryOre.materialName} />
              ) : (
                <OreIcon meta={smallOre.ore.meta} displayName={smallOre.ore.materialName} />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">
                {vein ? getVeinDisplayName(vein) : smallOre.ore.materialName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {vein ? "Ore Vein" : "Small Ore"}
                </span>
                <span className="text-xs text-text-muted font-mono">
                  {vein ? vein.name : smallOre.name}
                </span>
              </div>
              {vein && (
                <div className="text-xs text-text-muted mt-2">
                  Y: {vein.minY} - {vein.maxY} | Weight: {vein.weight} |
                  Density: {vein.density} | Size: {vein.size}
                </div>
              )}
              {smallOre && (
                <div className="text-xs text-text-muted mt-2">
                  Y: {smallOre.minY} - {smallOre.maxY} | Amount: {smallOre.amount}
                </div>
              )}
            </div>
          </div>

          {/* Dimensions */}
          <div className="flex flex-wrap gap-1 mt-4">
            {(vein ? vein.dimensions : smallOre.dimensions).map((dim: string) => (
              <span
                key={dim}
                className="text-xs px-2 py-0.5 bg-bg-elevated rounded text-text-muted border border-border-default"
              >
                {dim}
              </span>
            ))}
          </div>
        </div>

        {/* Y-level visualization */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Y-Level Distribution</h2>
          <div className="h-4 bg-bg-primary rounded-full relative overflow-hidden">
            <div
              className="absolute h-full bg-cyan-500/40 rounded-full"
              style={{
                left: `${((vein ? vein.minY : smallOre.minY) / maxY) * 100}%`,
                width: `${(((vein ? vein.maxY : smallOre.maxY) - (vein ? vein.minY : smallOre.minY)) / maxY) * 100}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted font-medium">
              Y {vein ? vein.minY : smallOre.minY} - {vein ? vein.maxY : smallOre.maxY}
            </div>
          </div>
        </div>

        {/* Ore Composition */}
        {vein && (
          <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Ore Composition</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { label: "Primary Ore", ore: vein.primaryOre, color: "text-accent-primary" },
                { label: "Secondary Ore", ore: vein.secondaryOre, color: "text-accent-secondary" },
                { label: "Between Ore", ore: vein.betweenOre, color: "text-accent-success" },
                { label: "Sporadic Ore", ore: vein.sporadicOre, color: "text-accent-purple" },
              ]).map(({ label, ore, color }) => (
                <div key={label} className="bg-bg-primary rounded-lg p-3 flex items-center gap-3">
                  <OreIcon meta={ore.meta} displayName={ore.materialName} />
                  <div>
                    <div className={`text-sm font-medium mb-0.5 ${color}`}>{label}</div>
                    <div className="text-text-primary">{ore.materialName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {smallOre && (
          <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Ore Details</h2>
            <div className="bg-bg-primary rounded-lg p-3 flex items-center gap-3">
              <OreIcon meta={smallOre.ore.meta} displayName={smallOre.ore.materialName} />
              <div>
                <div className="text-sm font-medium text-accent-primary mb-0.5">Ore Type</div>
                <div className="text-text-primary">{smallOre.ore.materialName}</div>
                <div className="text-xs text-text-muted mt-1">Amount per vein: {smallOre.amount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Related Veins in Same Dimensions */}
        {relatedVeins.length > 0 && (
          <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Other Veins in These Dimensions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {relatedVeins.map((relatedVein: any, i: number) => (
                <Link prefetch={false}
                  key={i}
                  href={`/ores/${veinSlug(relatedVein.name)}`}
                  className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <OreIcon meta={relatedVein.primaryOre.meta} displayName={relatedVein.primaryOre.materialName} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">
                      {getVeinDisplayName(relatedVein)}
                    </div>
                    <div className="text-xs text-text-muted">
                      Y: {relatedVein.minY} - {relatedVein.maxY}
                    </div>
                  </div>
                  <div className="text-xs text-accent-cyan">→</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Small Ores in Same Dimensions */}
        {relatedSmallOres.length > 0 && (
          <div className="bg-bg-tertiary border border-border-default rounded-xl p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Small Ores in These Dimensions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {relatedSmallOres.map((relatedOre: any, i: number) => (
                <Link prefetch={false}
                  key={i}
                  href={`/ores/${veinSlug(relatedOre.name)}`}
                  className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg hover:bg-bg-elevated transition-colors"
                >
                  <OreIcon meta={relatedOre.ore.meta} displayName={relatedOre.ore.materialName} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">
                      {relatedOre.ore.materialName}
                    </div>
                    <div className="text-xs text-text-muted">
                      Y: {relatedOre.minY} - {relatedOre.maxY} | Amount: {relatedOre.amount}
                    </div>
                  </div>
                  <div className="text-xs text-accent-cyan">→</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
