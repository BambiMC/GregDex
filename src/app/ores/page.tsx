"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

const DIMENSIONS = [
  { key: "", label: "All" },
  { key: "overworld", label: "Overworld" },
  { key: "nether", label: "Nether" },
  { key: "end", label: "The End" },
  { key: "end_asteroid", label: "End Asteroids" },
  { key: "twilight_forest", label: "Twilight Forest" },
];

interface OreVein {
  name: string;
  minY: number;
  maxY: number;
  weight: number;
  density: number;
  size: number;
  primaryOre: { materialName: string };
  secondaryOre: { materialName: string };
  betweenOre: { materialName: string };
  sporadicOre: { materialName: string };
  dimensions: string[];
}

interface SmallOre {
  name: string;
  minY: number;
  maxY: number;
  amount: number;
  ore: { materialName: string };
  dimensions: string[];
}

function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function OresPage() {
  const [veins, setVeins] = useState<OreVein[]>([]);
  const [smallOres, setSmallOres] = useState<SmallOre[]>([]);
  const [loading, setLoading] = useState(true);
  const [dimension, setDimension] = useState("");
  const [tab, setTab] = useState<"veins" | "small">("veins");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const param = dimension ? `?dimension=${dimension}` : "";
    fetch(`/api/ores${param}`)
      .then((r) => r.json())
      .then((d) => {
        setVeins(d.veins || []);
        setSmallOres(d.smallOres || []);
      })
      .finally(() => setLoading(false));
  }, [dimension]);

  const filteredVeins = useMemo(() => {
    if (!search) return veins;
    const q = search.toLowerCase();
    return veins.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.primaryOre.materialName.toLowerCase().includes(q) ||
        v.secondaryOre.materialName.toLowerCase().includes(q) ||
        v.betweenOre.materialName.toLowerCase().includes(q) ||
        v.sporadicOre.materialName.toLowerCase().includes(q),
    );
  }, [veins, search]);

  const filteredSmall = useMemo(() => {
    if (!search) return smallOres;
    const q = search.toLowerCase();
    return smallOres.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.ore.materialName.toLowerCase().includes(q),
    );
  }, [smallOres, search]);

  // Max Y for bar scaling
  const maxY = 256;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Ore Veins</h1>
        <p className="text-text-secondary text-sm mb-6">
          {veins.length} ore veins, {smallOres.length} small ores
        </p>

        {/* Dimension tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          {DIMENSIONS.map((dim) => (
            <button
              key={dim.key}
              onClick={() => setDimension(dim.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                dimension === dim.key
                  ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30"
                  : "bg-bg-tertiary text-text-muted border border-border-default hover:bg-bg-elevated"
              }`}
            >
              {dim.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ores..."
            className="flex-1 max-w-md px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
          <div className="flex gap-1">
            <button
              onClick={() => setTab("veins")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                tab === "veins"
                  ? "bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30"
                  : "bg-bg-tertiary text-text-muted border border-border-default"
              }`}
            >
              Veins ({filteredVeins.length})
            </button>
            <button
              onClick={() => setTab("small")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                tab === "small"
                  ? "bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30"
                  : "bg-bg-tertiary text-text-muted border border-border-default"
              }`}
            >
              Small ({filteredSmall.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-bg-tertiary rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : tab === "veins" ? (
          <div className="space-y-2">
            {filteredVeins.map((vein) => (
              <div
                key={vein.name}
                className="bg-bg-tertiary border border-border-default rounded-lg p-4 hover:border-border-bright transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      href={`/ores/${encodeId(vein.name)}`}
                      className="font-medium text-text-primary text-sm hover:text-accent-cyan transition-colors"
                    >
                      {vein.name.replace("ore.mix.", "")}
                    </Link>
                    <div className="text-xs text-text-muted mt-0.5">
                      Y: {vein.minY} - {vein.maxY} | Weight: {vein.weight} |
                      Density: {vein.density} | Size: {vein.size}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {vein.dimensions.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] px-1.5 py-0.5 bg-bg-elevated rounded text-text-muted border border-border-default"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Y-level bar */}
                <div className="h-3 bg-bg-primary rounded-full mb-3 relative overflow-hidden">
                  <div
                    className="absolute h-full bg-cyan-500/30 rounded-full"
                    style={{
                      left: `${(vein.minY / maxY) * 100}%`,
                      width: `${((vein.maxY - vein.minY) / maxY) * 100}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-text-muted">
                    Y {vein.minY}-{vein.maxY}
                  </div>
                </div>

                {/* Ore types */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-text-muted">Primary: </span>
                    <span className="text-accent-primary">
                      {vein.primaryOre.materialName}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Secondary: </span>
                    <span className="text-accent-secondary">
                      {vein.secondaryOre.materialName}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Between: </span>
                    <span className="text-accent-success">
                      {vein.betweenOre.materialName}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Sporadic: </span>
                    <span className="text-accent-purple">
                      {vein.sporadicOre.materialName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-default rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary border-b border-border-default">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                    Ore
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                    Y Range
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                    Dimensions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredSmall.map((ore) => (
                  <tr
                    key={ore.name}
                    className="hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-3 py-2 font-medium">
                      <Link
                        href={`/ores/${encodeId(ore.name)}`}
                        className="text-text-primary hover:text-accent-cyan transition-colors"
                      >
                        {ore.ore.materialName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {ore.minY} - {ore.maxY}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {ore.amount}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {ore.dimensions.map((d) => (
                          <span
                            key={d}
                            className="text-[10px] px-1.5 py-0.5 bg-bg-elevated rounded text-text-muted"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
