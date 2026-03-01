"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

function encodeId(id: string): string {
  return btoa(id).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface Material {
  name: string;
  localizedName: string;
  chemicalFormula?: string;
  meltingPoint?: number;
  blastFurnaceTemp?: number;
  mass?: number;
  density?: number;
  toolSpeed?: number;
  toolDurability?: number;
  processingTierEU?: number;
}

type SortField = "localizedName" | "meltingPoint" | "blastFurnaceTemp" | "mass" | "toolSpeed";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("localizedName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetch("/data/materials.json")
      .then((r) => r.json())
      .then((d) => setMaterials(d))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = materials;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.localizedName?.toLowerCase().includes(q) ||
          m.name?.toLowerCase().includes(q) ||
          m.chemicalFormula?.toLowerCase().includes(q)
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
  }, [materials, search, sortField, sortDir]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Materials</h1>
        <p className="text-text-secondary text-sm mb-6">
          {materials.length.toLocaleString()} GregTech materials
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search materials by name or formula..."
          className="w-full max-w-md px-4 py-2 mb-6 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
        />

        {loading ? (
          <div className="h-96 bg-bg-tertiary rounded-lg animate-pulse" />
        ) : (
          <div className="overflow-x-auto border border-border-default rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary border-b border-border-default">
                <tr>
                  <SortHeader field="localizedName" label="Name" />
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                    Formula
                  </th>
                  <SortHeader field="meltingPoint" label="Melting" />
                  <SortHeader field="blastFurnaceTemp" label="Blast Temp" />
                  <SortHeader field="mass" label="Mass" />
                  <SortHeader field="toolSpeed" label="Tool Speed" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filtered.slice(0, 200).map((mat) => (
                  <tr
                    key={mat.name}
                    className="hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/materials/${encodeId(mat.name)}`}
                        className="font-medium text-text-primary hover:text-accent-primary transition-colors cursor-pointer"
                      >
                        {mat.localizedName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-text-muted font-mono text-xs">
                      {mat.chemicalFormula || "-"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {mat.meltingPoint ? `${mat.meltingPoint}K` : "-"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {mat.blastFurnaceTemp ? `${mat.blastFurnaceTemp}K` : "-"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {mat.mass ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {mat.toolSpeed ?? "-"}
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
