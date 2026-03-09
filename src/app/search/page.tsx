"use client";

import { useSearchParams } from "next/navigation";
import SearchResults from "@/components/search/SearchResults";

export default function SearchPage() {
    const params = useSearchParams();
    const q = params?.get("q") || "";

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Search</h1>
                {q ? <p className="text-sm text-text-muted">Results for “{q}”</p> : <p className="text-sm text-text-muted">Enter a query using the search box.</p>}
            </div>

            <SearchResults query={q} />
        </div>
    );
}
