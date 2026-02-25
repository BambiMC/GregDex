"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface FluidEntry {
  name: string;
  displayName: string;
  type: "fluid";
  fluidType?: "fluid" | "gas" | "molten" | "plasma";
}

function createReadableFluidId(fluidId: string): string {
  // For fluids, convert dots to hyphens for readable URLs
  return fluidId.replace(/\./g, "-");
}

function getFluidUrl(fluid: FluidEntry): string {
  return `/fluids/${createReadableFluidId(fluid.name)}`;
}

function getFluidType(name: string): "fluid" | "gas" | "molten" | "plasma" {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("plasma")) return "plasma";
  if (
    lowerName.includes("gas") ||
    lowerName.includes("vapor") ||
    lowerName.includes("steam")
  )
    return "gas";
  if (lowerName.includes("molten")) return "molten";
  return "fluid";
}

function getFluidTypeColor(
  fluidType: "fluid" | "gas" | "molten" | "plasma",
): string {
  switch (fluidType) {
    case "plasma":
      return "bg-accent-purple/20 text-accent-purple";
    case "gas":
      return "bg-accent-blue/20 text-accent-blue";
    case "molten":
      return "bg-accent-danger/20 text-accent-danger";
    default:
      return "bg-accent-secondary/20 text-accent-secondary";
  }
}

function getFluidIcon(fluid: FluidEntry): React.ReactElement {
  const fluidType = fluid.fluidType || getFluidType(fluid.name);
  const colors = {
    plasma: "bg-accent-purple/10 border-accent-purple/30 text-accent-purple",
    gas: "bg-accent-blue/10 border-accent-blue/30 text-accent-blue",
    molten: "bg-accent-danger/10 border-accent-danger/30 text-accent-danger",
    fluid:
      "bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary",
  };

  return (
    <div
      className={`w-full h-full ${colors[fluidType]} border rounded flex items-center justify-center`}
    >
      <span className="text-[10px] font-bold">
        {fluid.displayName.substring(0, 2)}
      </span>
    </div>
  );
}

export default function FluidsGasesPage() {
  const [fluids, setFluids] = useState<FluidEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [fluidTypeFilter, setFluidTypeFilter] = useState<
    "all" | "fluid" | "gas" | "molten" | "plasma"
  >("all");
  const [loading, setLoading] = useState(true);

  const fetchFluids = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      try {
        if (q.length >= 2) {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&limit=60`,
          );
          const data = await res.json();
          const allFluids = (data.results || [])
            .filter((r: any) => r.type === "fluid")
            .map((r: any) => ({
              name: r.id,
              displayName: r.displayName,
              type: "fluid" as const,
              fluidType: getFluidType(r.id),
            }));

          const filteredFluids =
            fluidTypeFilter === "all"
              ? allFluids
              : allFluids.filter(
                  (f: FluidEntry) => f.fluidType === fluidTypeFilter,
                );

          setFluids(filteredFluids);
          setTotal(filteredFluids.length);
          setTotalPages(1);
        } else {
          const res = await fetch(`/api/fluids?page=${p}&limit=60`);
          const data = await res.json();
          const allFluids = (data.data || []).map((f: any) => ({
            ...f,
            type: "fluid" as const,
            fluidType: getFluidType(f.name),
          }));

          const filteredFluids =
            fluidTypeFilter === "all"
              ? allFluids
              : allFluids.filter(
                  (f: FluidEntry) => f.fluidType === fluidTypeFilter,
                );

          setFluids(filteredFluids);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch {
        setFluids([]);
      } finally {
        setLoading(false);
      }
    },
    [fluidTypeFilter],
  );

  useEffect(() => {
    const timeout = setTimeout(() => fetchFluids(page, search), 200);
    return () => clearTimeout(timeout);
  }, [page, search, fetchFluids]);

  useEffect(() => {
    setPage(1);
  }, [fluidTypeFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Fluids & Gases</h1>
        <p className="text-text-secondary text-sm mb-6">
          {total.toLocaleString()} fluids and gases
        </p>

        {/* Fluid Type Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "fluid", label: "Liquids" },
              { value: "gas", label: "Gases" },
              { value: "molten", label: "Molten" },
              { value: "plasma", label: "Plasma" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFluidTypeFilter(filter.value as any)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  fluidTypeFilter === filter.value
                    ? "bg-accent-primary text-white"
                    : "bg-bg-tertiary border border-border-default text-text-secondary hover:bg-bg-elevated"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filter fluids..."
            className="w-full max-w-md px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-bg-tertiary border border-border-default rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {fluids.map((fluid) => (
              <Link
                key={fluid.name}
                href={getFluidUrl(fluid)}
                className="flex items-center gap-3 px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg hover:border-border-bright transition-colors group"
              >
                <div className="item-slot !w-8 !h-8 shrink-0 group-hover:border-accent-primary">
                  {getFluidIcon(fluid)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary truncate group-hover:text-accent-primary transition-colors">
                    {fluid.displayName}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${getFluidTypeColor(fluid.fluidType || getFluidType(fluid.name))}`}
                    >
                      {fluid.fluidType || getFluidType(fluid.name)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
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
