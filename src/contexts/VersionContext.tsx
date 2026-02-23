"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { DEFAULT_VERSION, GTNHVersion, GTNH_VERSIONS } from "@/types/versions";

interface VersionContextType {
  currentVersion: string;
  setCurrentVersion: (version: string) => void;
  availableVersions: GTNHVersion[];
  getCurrentVersionConfig: () => GTNHVersion;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [currentVersion, setCurrentVersionState] = useState(DEFAULT_VERSION);

  const setCurrentVersion = (version: string) => {
    setCurrentVersionState(version);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("gregdex-version", version);
    }
  };

  const getCurrentVersionConfig = () => {
    return (
      GTNH_VERSIONS.find((v) => v.id === currentVersion) || GTNH_VERSIONS[0]
    );
  };

  // Load saved version from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gregdex-version");
      if (saved && GTNH_VERSIONS.some((v) => v.id === saved)) {
        setCurrentVersionState(saved);
      }
    }
  }, []);

  return (
    <VersionContext.Provider
      value={{
        currentVersion,
        setCurrentVersion,
        availableVersions: GTNH_VERSIONS,
        getCurrentVersionConfig,
      }}
    >
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion() {
  const context = useContext(VersionContext);
  if (context === undefined) {
    throw new Error("useVersion must be used within a VersionProvider");
  }
  return context;
}
