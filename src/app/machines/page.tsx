"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMachineDisplayName, getMachineIconPath } from "@/lib/format";

interface MachineInfo {
  id: string;
  displayName: string;
  recipeCount: number;
  category: string;
}

function MachineIcon({ machineId }: { machineId: string }) {
  const [failed, setFailed] = useState(false);
  const iconPath = getMachineIconPath(machineId);

  if (!iconPath || failed) {
    return (
      <div className="w-8 h-8 rounded bg-bg-elevated border border-border-default flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={iconPath}
      alt=""
      width={32}
      height={32}
      className="pixelated w-8 h-8 shrink-0"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<MachineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/data/machines.json")
      .then((r) => r.json())
      .then((d) => setMachines(d))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(machines.map((m) => m.category))];
  const filtered = filter
    ? machines.filter(
        (m) =>
          getMachineDisplayName(m.id).toLowerCase().includes(filter.toLowerCase()) ||
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
                    <Link prefetch={false}
                      key={machine.id}
                      href={`/machines/${encodeURIComponent(machine.id)}`}
                      className="flex items-center gap-3 px-4 py-3 bg-bg-tertiary border border-border-default rounded-lg hover:border-border-bright transition-colors group"
                    >
                      <MachineIcon machineId={machine.id} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary group-hover:text-accent-secondary transition-colors truncate">
                          {getMachineDisplayName(machine.id)}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5 truncate">
                          {machine.id}
                        </div>
                      </div>
                      <span className="text-sm text-accent-primary font-medium shrink-0">
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
