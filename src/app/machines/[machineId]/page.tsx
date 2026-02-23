"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import RecipeCard from "@/components/recipes/RecipeCard";

export default function MachineDetailPage({
  params,
}: {
  params: Promise<{ machineId: string }>;
}) {
  const { machineId } = use(params);
  const decodedId = decodeURIComponent(machineId);
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    fetch(
      `/api/recipes/by-machine/${encodeURIComponent(decodedId)}?page=${page}&limit=20${searchParam}`,
    )
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [decodedId, page, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/machines" className="hover:text-accent-secondary">
            Machines
          </Link>
          <span>/</span>
          <span className="text-text-secondary">
            {data?.machine?.displayName || decodedId}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-1">
          {data?.machine?.displayName || decodedId}
        </h1>
        <p className="text-text-secondary text-sm mb-6">
          {data?.total?.toLocaleString() || "..."} recipes
        </p>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to page 1 when searching
            }}
            placeholder="Search recipes..."
            className="w-full max-w-md px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {/* Recipes */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-bg-tertiary rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.recipes || []).map((recipe: any, i: number) => (
              <RecipeCard key={`${page}-${i}`} recipe={recipe} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.totalPages, page + 1))}
              disabled={page === data.totalPages}
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
