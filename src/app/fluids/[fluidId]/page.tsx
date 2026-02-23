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
        <Link href="/items" className="text-accent-secondary hover:underline">
          Back to Items
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
          <Link href="/items" className="hover:text-accent-secondary">
            Items
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
            Fluid Information
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
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">Type</span>
              <span className="px-2 py-0.5 rounded text-xs bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                Fluid
              </span>
            </div>
          </div>
        </div>

        {/* Usage Note */}
        <div className="mt-6 p-4 bg-bg-tertiary border border-border-default rounded-lg">
          <p className="text-sm text-text-muted">
            This fluid is used in various machine recipes and processes. You can
            find it in recipe listings throughout the application.
          </p>
        </div>
      </div>
    </div>
  );
}
