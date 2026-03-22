"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const VOLTAGE_TIERS = [
  { name: "ULV", voltage: 8 },
  { name: "LV", voltage: 32 },
  { name: "MV", voltage: 128 },
  { name: "HV", voltage: 512 },
  { name: "EV", voltage: 2048 },
  { name: "IV", voltage: 8192 },
  { name: "LuV", voltage: 32768 },
  { name: "ZPM", voltage: 131072 },
  { name: "UV", voltage: 524288 },
  { name: "UHV", voltage: 2097152 },
  { name: "UEV", voltage: 8388608 },
  { name: "UIV", voltage: 33554432 },
  { name: "UMV", voltage: 134217728 },
  { name: "UXV", voltage: 536870912 },
  { name: "MAX", voltage: 2147483648 },
] as const;

const QUICK_EU_VALUES = [2, 4, 8, 16, 30, 120, 480, 1920, 7680, 30720];

function getBaseTierIndex(euPerTick: number): number {
  for (let i = 0; i < VOLTAGE_TIERS.length; i++) {
    if (euPerTick <= VOLTAGE_TIERS[i].voltage) return i;
  }
  return VOLTAGE_TIERS.length - 1;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDuration(ticks: number): string {
  const seconds = ticks / 20;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(0)}s`;
}

interface OverclockResult {
  tierIndex: number;
  tierName: string;
  voltage: number;
  euPerTick: number;
  durationTicks: number;
  totalEU: number;
  overclocks: number;
  bottlenecked: boolean;
}

function calculateOverclocks(
  baseEuPerTick: number,
  baseDurationTicks: number,
  perfect: boolean
): OverclockResult[] {
  if (baseEuPerTick <= 0 || baseDurationTicks <= 0) return [];

  const baseTierIndex = getBaseTierIndex(baseEuPerTick);
  const durationDivisor = perfect ? 4 : 2;
  const results: OverclockResult[] = [];

  for (let i = baseTierIndex; i < VOLTAGE_TIERS.length; i++) {
    const overclocks = i - baseTierIndex;
    let euPerTick = baseEuPerTick;
    let durationTicks = baseDurationTicks;

    for (let oc = 0; oc < overclocks; oc++) {
      if (durationTicks <= 1) break;
      euPerTick *= 4;
      durationTicks = Math.max(1, Math.floor(durationTicks / durationDivisor));
    }

    const bottlenecked = durationTicks <= 1 && overclocks > 0;
    const totalEU = euPerTick * durationTicks;

    results.push({
      tierIndex: i,
      tierName: VOLTAGE_TIERS[i].name,
      voltage: VOLTAGE_TIERS[i].voltage,
      euPerTick,
      durationTicks,
      totalEU,
      overclocks,
      bottlenecked,
    });
  }

  return results;
}

export default function OverclockPage() {
  const [euPerTick, setEuPerTick] = useState<string>("30");
  const [durationTicks, setDurationTicks] = useState<string>("200");
  const [perfect, setPerfect] = useState(false);
  const [durationUnit, setDurationUnit] = useState<"ticks" | "seconds">("ticks");

  const euValue = Number(euPerTick) || 0;
  const rawDurationInput = Number(durationTicks) || 0;
  const durationValue = durationUnit === "seconds"
    ? Math.round(rawDurationInput * 20)
    : rawDurationInput;

  const results = useMemo(
    () => calculateOverclocks(euValue, durationValue, perfect),
    [euValue, durationValue, perfect]
  );

  const baseTierIndex = euValue > 0 ? getBaseTierIndex(euValue) : -1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <Link
            href="/"
            className="hover:text-text-secondary transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-text-secondary">Tools</span>
          <span>/</span>
          <span className="text-text-primary">Overclock Calculator</span>
        </nav>

        <h1 className="text-2xl font-bold mb-1">Overclock Calculator</h1>
        <p className="text-text-secondary text-sm mb-8">
          Calculate overclocked EU/t and duration for any GTNH recipe across
          voltage tiers.
        </p>

        {/* Input Section */}
        <div className="bg-bg-tertiary border border-border-default rounded-lg p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* EU/t Input */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Base EU/t
              </label>
              <input
                type="number"
                min="1"
                value={euPerTick}
                onChange={(e) => setEuPerTick(e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Duration Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Base Duration
                </label>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => {
                      if (durationUnit === "seconds") {
                        // Convert current seconds value to ticks
                        const val = Number(durationTicks) || 0;
                        setDurationTicks(String(Math.round(val * 20)));
                        setDurationUnit("ticks");
                      }
                    }}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-l-md border transition-colors cursor-pointer ${
                      durationUnit === "ticks"
                        ? "bg-accent-primary/20 border-accent-primary text-accent-primary"
                        : "bg-bg-secondary border-border-default text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    Ticks
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (durationUnit === "ticks") {
                        // Convert current ticks value to seconds
                        const val = Number(durationTicks) || 0;
                        setDurationTicks(String(+(val / 20).toFixed(2)));
                        setDurationUnit("seconds");
                      }
                    }}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-r-md border -ml-px transition-colors cursor-pointer ${
                      durationUnit === "seconds"
                        ? "bg-accent-primary/20 border-accent-primary text-accent-primary"
                        : "bg-bg-secondary border-border-default text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    Seconds
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0.05"
                step={durationUnit === "seconds" ? "0.05" : "1"}
                value={durationTicks}
                onChange={(e) => setDurationTicks(e.target.value)}
                placeholder={durationUnit === "ticks" ? "e.g. 200" : "e.g. 10"}
                className="w-full px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {durationValue > 0 && (
                <p className="text-xs text-text-muted mt-1">
                  = {durationValue}t ({formatDuration(durationValue)})
                </p>
              )}
            </div>
          </div>

          {/* Voltage tier template buttons */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted uppercase mb-2">
              Set EU/t to tier voltage
            </label>
            <div className="flex flex-wrap gap-2">
              {VOLTAGE_TIERS.map((tier) => {
                const active = euValue === tier.voltage;
                return (
                  <button
                    type="button"
                    key={tier.name}
                    onClick={() => setEuPerTick(String(tier.voltage))}
                    className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      active
                        ? "border-current"
                        : "bg-bg-secondary border-border-default text-text-secondary hover:border-text-muted hover:text-text-primary"
                    }`}
                    style={
                      active
                        ? {
                            color: `var(--color-tier-${tier.name.toLowerCase()})`,
                            backgroundColor: `color-mix(in srgb, var(--color-tier-${tier.name.toLowerCase()}) 15%, transparent)`,
                            borderColor: `var(--color-tier-${tier.name.toLowerCase()})`,
                          }
                        : undefined
                    }
                  >
                    <span className="font-bold">{tier.name}</span>
                    <span className="ml-1.5 opacity-70">{formatNumber(tier.voltage)}V</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overclock Mode Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-secondary">
              Overclock Mode:
            </label>
            <button
              type="button"
              onClick={() => setPerfect(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-l-md border transition-colors cursor-pointer ${
                !perfect
                  ? "bg-accent-primary/20 border-accent-primary text-accent-primary"
                  : "bg-bg-secondary border-border-default text-text-muted hover:text-text-secondary"
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setPerfect(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-r-md border -ml-3 transition-colors cursor-pointer ${
                perfect
                  ? "bg-accent-secondary/20 border-accent-secondary text-accent-secondary"
                  : "bg-bg-secondary border-border-default text-text-muted hover:text-text-secondary"
              }`}
            >
              Perfect (EBF, etc.)
            </button>
            <span className="text-xs text-text-muted ml-2 hidden sm:inline">
              {perfect
                ? "Duration / 4 per tier (EU/t x 4)"
                : "Duration / 2 per tier (EU/t x 4)"}
            </span>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text-primary">
                Results
              </h2>
              <span className="text-xs text-text-muted">
                Base tier:{" "}
                <span
                  style={{
                    color: `var(--color-tier-${VOLTAGE_TIERS[baseTierIndex].name.toLowerCase()})`,
                  }}
                  className="font-semibold"
                >
                  {VOLTAGE_TIERS[baseTierIndex].name}
                </span>{" "}
                ({formatNumber(VOLTAGE_TIERS[baseTierIndex].voltage)}V)
              </span>
            </div>

            <div className="overflow-x-auto border border-border-default rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary border-b border-border-default">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                      Tier
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-muted uppercase">
                      Voltage
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-muted uppercase">
                      EU/t
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-muted uppercase">
                      Duration
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-muted uppercase">
                      Total EU
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      OCs
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {results.map((r) => (
                    <tr
                      key={r.tierIndex}
                      className={`transition-colors ${
                        r.overclocks === 0
                          ? "bg-bg-tertiary"
                          : "hover:bg-bg-elevated"
                      } ${r.bottlenecked ? "opacity-60" : ""}`}
                    >
                      <td className="px-3 py-2">
                        <span
                          className="font-semibold"
                          style={{
                            color: `var(--color-tier-${r.tierName.toLowerCase()})`,
                          }}
                        >
                          {r.tierName}
                        </span>
                        {r.overclocks === 0 && (
                          <span className="ml-2 text-[10px] text-text-muted uppercase tracking-wider">
                            base
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-text-secondary font-mono text-xs">
                        {formatNumber(r.voltage)}V
                      </td>
                      <td className="px-3 py-2 text-right text-text-primary font-mono text-xs font-medium">
                        {formatNumber(r.euPerTick)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        <span
                          className={
                            r.bottlenecked
                              ? "text-amber-400 font-semibold"
                              : "text-text-primary"
                          }
                        >
                          {formatNumber(r.durationTicks)}t
                        </span>
                        <span className="text-text-muted ml-1.5">
                          ({formatDuration(r.durationTicks)})
                        </span>
                        {r.bottlenecked && (
                          <span
                            className="ml-1.5 text-amber-400"
                            title="Duration has bottomed out at 1 tick"
                          >
                            !
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-text-secondary font-mono text-xs">
                        {formatNumber(r.totalEU)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.overclocks > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-primary/15 text-accent-primary text-xs font-semibold">
                            {r.overclocks}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
              <span>
                <span className="text-amber-400 font-semibold">!</span> =
                duration bottomed out at 1 tick (0.05s)
              </span>
              <span>OCs = number of overclocks from base tier</span>
              <span>1 tick = 0.05 seconds</span>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <p className="text-lg mb-2">Enter recipe values above</p>
            <p className="text-sm">
              Provide a base EU/t and duration in ticks to see overclock results
              across all voltage tiers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
