"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SearchResults from "@/components/search/SearchResults";

function SearchContent() {
    const params = useSearchParams();
    const q = params?.get("q") || "";

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Search</h1>
                {q ? <p className="text-sm text-text-muted">Results for &quot;{q}&quot;</p> : <p className="text-sm text-text-muted">Enter a query using the search box.</p>}
            </div>

            <SearchResults query={q} />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense>
            <SearchContent />
        </Suspense>
    );
}
