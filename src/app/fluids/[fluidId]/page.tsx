"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function FluidDetailPage({
  params,
}: {
  params: Promise<{ fluidId: string }>;
}) {
  const { fluidId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/fluids/${fluidId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Error loading fluid:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fluidId]);

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

  if (!data?.fluid) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Fluid Not Found
        </h1>
        <Link href="/fluids-gases" className="text-accent-secondary hover:underline">
          Back to Fluids & Gases
        </Link>
      </div>
    );
  }

  const { fluid } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/fluids-gases" className="hover:text-accent-secondary">
            Fluids & Gases
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{fluid.displayName}</span>
        </div>

        {/* Header */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent-secondary/20 border border-accent-secondary/30 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-2xl">💧</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">
                {fluid.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                  Fluid
                </span>
                <span className="text-xs text-text-muted font-mono">
                  {fluid.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Fluid Properties
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-sm text-text-muted">Display Name</span>
              <span className="text-sm text-text-primary font-medium">
                {fluid.displayName}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-sm text-text-muted">Internal Name</span>
              <span className="text-sm text-text-primary font-mono">
                {fluid.name}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-default">
              <span className="text-sm text-text-muted">Fluid Type</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                fluid.name.includes("plasma") || fluid.name.includes("gas") || fluid.name.includes("vapor") || fluid.name.includes("steam")
                  ? "bg-accent-purple/10 text-accent-purple border border-accent-purple/20"
                  : fluid.name.includes("molten")
                  ? "bg-accent-danger/10 text-accent-danger border border-accent-danger/20"
                  : "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
              }`}>
                {fluid.name.includes("plasma") || fluid.name.includes("gas") || fluid.name.includes("vapor") || fluid.name.includes("steam")
                  ? "Gas"
                  : fluid.name.includes("molten")
                  ? "Molten"
                  : "Liquid"
                }
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">Category</span>
              <span className="text-sm text-text-primary">
                {fluid.name.includes("molten") ? "Molten Metal" : 
                 fluid.name.includes("plasma") ? "Plasma" :
                 fluid.name.includes("steam") ? "Steam" :
                 fluid.name.includes("potion") ? "Potion" :
                 fluid.name.includes("bio") ? "Biofuel" :
                 "Industrial Fluid"}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Information */}
        <div className="mt-6 bg-bg-tertiary border border-border-default rounded-xl p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Usage & Applications
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Common Uses</h3>
              <ul className="text-sm text-text-muted space-y-1">
                {fluid.name.includes("molten") && (
                  <>
                    <li>• Metal processing and alloy creation</li>
                    <li>• High-temperature industrial processes</li>
                    <li>• Advanced material fabrication</li>
                  </>
                )}
                {fluid.name.includes("plasma") && (
                  <>
                    <li>• Advanced energy generation</li>
                    <li>• High-tech manufacturing processes</li>
                    <li>• Fusion reactor applications</li>
                  </>
                )}
                {fluid.name.includes("steam") && (
                  <>
                    <li>• Power generation and turbines</li>
                    <li>• Heat transfer systems</li>
                    <li>• Industrial process heating</li>
                  </>
                )}
                {fluid.name.includes("fuel") && (
                  <>
                    <li>• Combustion engine fuel</li>
                    <li>• Rocket propulsion systems</li>
                    <li>• Power plant combustion</li>
                  </>
                )}
                {!fluid.name.includes("molten") && !fluid.name.includes("plasma") && 
                 !fluid.name.includes("steam") && !fluid.name.includes("fuel") && (
                  <>
                    <li>• Chemical processing and reactions</li>
                    <li>• Industrial cooling systems</li>
                    <li>• Material synthesis and refinement</li>
                  </>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Processing Notes</h3>
              <p className="text-sm text-text-muted">
                {fluid.name.includes("molten") 
                  ? "Handle with extreme caution. Requires specialized high-temperature containment systems and proper cooling procedures."
                  : fluid.name.includes("plasma")
                  ? "Requires magnetic containment systems and specialized plasma-handling equipment. Extremely high energy state."
                  : fluid.name.includes("steam")
                  ? "High-pressure steam requires proper pressure vessels and safety systems. Monitor temperature and pressure levels."
                  : "Standard industrial fluid handling procedures apply. Check compatibility with storage materials and processing equipment."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
