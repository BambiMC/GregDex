"use client";

import { useState } from "react";
import { useVersion } from "@/contexts/VersionContext";

export default function VersionSelector() {
  const { currentVersion, setCurrentVersion, availableVersions } = useVersion();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = availableVersions.find(v => v.id === currentVersion);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        {currentConfig?.displayName || "GTNH"}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-bg-elevated border border-border-default rounded-lg shadow-lg z-20">
            <div className="p-1">
              {availableVersions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => {
                    setCurrentVersion(version.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    version.id === currentVersion
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-primary hover:bg-bg-secondary"
                  }`}
                >
                  <div className="font-medium">{version.displayName}</div>
                  {version.isDefault && (
                    <div className="text-xs text-text-muted">Default version</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
