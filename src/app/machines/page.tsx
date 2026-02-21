"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MachineInfo {
  id: string;
  displayName: string;
  recipeCount: number;
  category: string;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<MachineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/machines")
      .then((r) => r.json())
      .then((d) => setMachines(d.machines || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(machines.map((m) => m.category))];
  const filtered = filter
    ? machines.filter(
        (m) =>
          m.displayName.toLowerCase().includes(filter.toLowerCase()) ||
          m.id.toLowerCase().includes(filter.toLowerCase())
      )
    : machines;
  const grouped = categories
    .map((cat) => ({
      category: cat,
      machines: filtered.filter((m) => m.category === cat),
    }))
    .filter((g) => g.machines.length > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Machines</h1>
        <p className="text-text-secondary text-sm mb-6">
          {machines.length} machine types with{" "}
          {machines.reduce((s, m) => s + m.recipeCount, 0).toLocaleString()}{" "}
          total recipes
        </p>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter machines..."
          className="w-full max-w-md px-4 py-2 mb-6 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
        />

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.category}>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  {group.category}
                  <span className="text-xs font-normal text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">
                    {group.machines.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.machines.map((machine) => (
                    <Link
                      key={machine.id}
                      href={`/machines/${encodeURIComponent(machine.id)}`}
                      className="flex items-center justify-between px-4 py-3 bg-bg-tertiary border border-border-default rounded-lg hover:border-border-bright transition-colors group"
                    >
                      <div>
                        <div className="text-sm font-medium text-text-primary group-hover:text-accent-secondary transition-colors">
                          {machine.displayName}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {machine.id}
                        </div>
                      </div>
                      <span className="text-sm text-accent-primary font-medium">
                        {machine.recipeCount.toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
