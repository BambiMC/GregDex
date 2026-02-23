"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Fluid {
  name: string;
  displayName: string;
}

type SortField = "displayName" | "name";

export default function FluidsGasesPage() {
  const [fluids, setFluids] = useState<Fluid[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("displayName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetch("/api/fluids")
      .then((r) => r.json())
      .then((d) => setFluids(d))
      .catch(() => {
        setFluids([]);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = fluids;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.displayName?.toLowerCase().includes(q) ||
          f.name?.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      const aVal = (a as any)[sortField] ?? (sortDir === "asc" ? Infinity : -Infinity);
      const bVal = (b as any)[sortField] ?? (sortDir === "asc" ? Infinity : -Infinity);
      if (typeof aVal === "string")
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return result;
  }, [fluids, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      onClick={() => toggleSort(field)}
      className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-secondary select-none"
    >
      <span className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-accent-primary">{sortDir === "asc" ? "^" : "v"}</span>
        )}
      </span>
    </th>
  );

  const isGas = (name: string): boolean => {
    return name.includes("plasma") || name.includes("gas") || name.includes("vapor") || name.includes("steam");
  };

  const isMolten = (name: string): boolean => {
    return name.includes("molten");
  };

  const getFluidType = (name: string): string => {
    if (isGas(name)) return "Gas";
    if (isMolten(name)) return "Molten";
    return "Liquid";
  };

  const getFluidTypeColor = (name: string): string => {
    if (isGas(name)) return "bg-accent-purple/20 text-accent-purple";
    if (isMolten(name)) return "bg-accent-danger/20 text-accent-danger";
    return "bg-accent-primary/20 text-accent-primary";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Fluids & Gases</h1>
        <p className="text-text-secondary text-sm mb-6">
          {fluids.length.toLocaleString()} GregTech fluids and gases
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fluids and gases by name..."
          className="w-full max-w-md px-4 py-2 mb-6 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
        />

        {loading ? (
          <div className="h-96 bg-bg-tertiary rounded-lg animate-pulse" />
        ) : fluids.length === 0 ? (
          <div className="text-center py-12 bg-bg-tertiary rounded-lg border border-border-default">
            <div className="text-text-muted mb-2">No fluids data available</div>
            <div className="text-text-secondary text-sm">
              The fluids API endpoint may need to be implemented
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-default rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary border-b border-border-default">
                <tr>
                  <SortHeader field="displayName" label="Display Name" />
                  <SortHeader field="name" label="Internal Name" />
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filtered.slice(0, 200).map((fluid) => (
                  <tr
                    key={fluid.name}
                    className="hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/fluids/${fluid.name}`}
                        className="font-medium text-text-primary hover:text-accent-primary transition-colors cursor-pointer"
                      >
                        {fluid.displayName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-text-muted font-mono text-xs">
                      {fluid.name}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getFluidTypeColor(fluid.name)}`}
                      >
                        {getFluidType(fluid.name)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 200 && (
              <div className="px-3 py-2 text-center text-text-muted text-xs bg-bg-secondary border-t border-border-default">
                Showing first 200 of {filtered.length} results
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
