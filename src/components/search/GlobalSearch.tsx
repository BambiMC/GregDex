"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/types";
import ItemIcon from "@/components/ItemIcon";
import { createReadableItemId } from "@/lib/utils";

export default function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else {
          setQuery("");
          setResults([]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=15`,
      );
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const navigate = (result: SearchResult) => {
    const readableId = createReadableItemId(result.id);
    if (result.type === "item") {
      router.push(`/items/${readableId}`);
    } else if (result.type === "fluid") {
      // For fluids, convert dots to hyphens for readable URLs
      const readableFluidId = result.id.replace(/\./g, "-");
      router.push(`/fluids/${readableFluidId}`);
    } else {
      router.push(`/items/${readableId}`);
    }
    onClose();
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <div className="bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 border-b border-border-default">
            <svg
              className="w-5 h-5 text-text-muted shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search items, machines, materials..."
              className="flex-1 py-3 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            )}
            <kbd className="text-xs text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded border border-border-default">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((result, i) => (
                <button
                  key={result.id}
                  onClick={() => navigate(result)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                    i === selectedIndex
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  <div className="item-slot !w-8 !h-8 shrink-0">
                    <ItemIcon
                      itemId={result.id}
                      displayName={result.displayName}
                      size={28}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{result.displayName}</div>
                    {result.modId && (
                      <div className="text-xs text-text-muted truncate">
                        {result.modId}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="py-8 text-center text-text-muted text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Hint */}
          {query.length < 2 && (
            <div className="py-8 text-center text-text-muted text-sm">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
