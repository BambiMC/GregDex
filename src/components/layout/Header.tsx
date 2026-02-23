"use client";

import Link from "next/link";
import { useState } from "react";
import GlobalSearch from "@/components/search/GlobalSearch";
import VersionSelector from "@/components/VersionSelector";

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-border-default bg-bg-secondary/95 backdrop-blur-sm">
        <div className="flex h-full items-center gap-3 px-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
              <span className="text-accent-primary font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-lg text-text-primary hidden sm:block">
              Greg<span className="text-accent-primary">Dex</span>
            </span>
          </Link>

          {/* Search bar trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-xl mx-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default bg-bg-primary/50 text-text-muted text-sm hover:border-border-bright transition-colors"
          >
            <svg
              className="w-4 h-4"
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
            <span className="hidden sm:block">Search items, recipes...</span>
            <span className="sm:hidden">Search...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg-elevated text-xs text-text-muted border border-border-default ml-auto">
              Ctrl+K
            </kbd>
          </button>

          {/* Version selector */}
          <VersionSelector />
        </div>
      </header>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
