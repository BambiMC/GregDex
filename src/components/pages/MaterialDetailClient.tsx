"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

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
  oreValue?: number;
}

export default function MaterialDetailClient({
  params,
}: {
  params: Promise<{ materialName: string }>;
}) {
  const { materialName } = use(params);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // materialName is base64url-encoded
        let name: string;
        try {
          name = atob(materialName.replace(/-/g, "+").replace(/_/g, "/"));
        } catch {
          name = materialName;
        }

        const res = await fetch("/data/materials.json");
        if (!res.ok) return;
        const all: Material[] = await res.json();
        const found = all.find((m) => m.name === name) || null;
        setMaterial(found);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [materialName]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-48 bg-bg-tertiary rounded animate-pulse mb-4" />
          <div className="h-64 bg-bg-tertiary rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Material Not Found
        </h1>
        <Link href="/materials" className="text-accent-secondary hover:underline">
          Back to Materials
        </Link>
      </div>
    );
  }

  const props: { label: string; value: string | number | undefined; unit?: string }[] = [
    { label: "Chemical Formula", value: material.chemicalFormula },
    { label: "Melting Point", value: material.meltingPoint, unit: "K" },
    { label: "Blast Furnace Temp", value: material.blastFurnaceTemp, unit: "K" },
    { label: "Mass", value: material.mass },
    { label: "Density", value: material.density },
    { label: "Tool Speed", value: material.toolSpeed },
    { label: "Tool Durability", value: material.toolDurability },
    { label: "Processing Tier EU", value: material.processingTierEU, unit: "EU" },
    { label: "Ore Value", value: material.oreValue },
  ].filter((p) => p.value !== undefined && p.value !== null && p.value !== "");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/materials" className="hover:text-accent-secondary">
            Materials
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{material.localizedName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent-secondary/20 border border-accent-secondary/30 rounded-lg flex items-center justify-center shrink-0 text-lg font-bold text-accent-secondary">
              {material.chemicalFormula ? material.chemicalFormula.substring(0, 2) : material.localizedName.substring(0, 2)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">
                {material.localizedName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                  Material
                </span>
                <span className="text-xs text-text-muted font-mono">
                  {material.name}
                </span>
              </div>
              {material.chemicalFormula && (
                <div className="mt-2 text-sm text-text-secondary font-mono">
                  {material.chemicalFormula}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties */}
        {props.length > 0 && (
          <div className="bg-bg-tertiary border border-border-default rounded-xl p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Properties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {props.map((prop) => (
                <div key={prop.label} className="bg-bg-primary rounded-lg p-3">
                  <div className="text-xs text-text-muted mb-1">{prop.label}</div>
                  <div className="text-sm font-medium text-text-primary">
                    {prop.value}{prop.unit ? ` ${prop.unit}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
