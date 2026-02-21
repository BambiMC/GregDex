export function formatEU(eu: number): string {
  if (eu >= 1_000_000_000) return `${(eu / 1_000_000_000).toFixed(1)}B EU`;
  if (eu >= 1_000_000) return `${(eu / 1_000_000).toFixed(1)}M EU`;
  if (eu >= 1_000) return `${(eu / 1_000).toFixed(1)}K EU`;
  return `${eu} EU`;
}

export function formatDuration(ticks: number): string {
  const seconds = ticks / 20;
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  }
  return `${seconds.toFixed(1)}s`;
}

export function formatTicks(ticks: number): string {
  return `${ticks}t (${formatDuration(ticks)})`;
}

export function getVoltageTier(euPerTick: number): {
  name: string;
  color: string;
} {
  const tiers = [
    { name: "ULV", max: 8, color: "var(--color-tier-ulv)" },
    { name: "LV", max: 32, color: "var(--color-tier-lv)" },
    { name: "MV", max: 128, color: "var(--color-tier-mv)" },
    { name: "HV", max: 512, color: "var(--color-tier-hv)" },
    { name: "EV", max: 2048, color: "var(--color-tier-ev)" },
    { name: "IV", max: 8192, color: "var(--color-tier-iv)" },
    { name: "LuV", max: 32768, color: "var(--color-tier-luv)" },
    { name: "ZPM", max: 131072, color: "var(--color-tier-zpm)" },
    { name: "UV", max: 524288, color: "var(--color-tier-uv)" },
    { name: "UHV", max: Infinity, color: "var(--color-tier-uhv)" },
  ];
  for (const tier of tiers) {
    if (euPerTick <= tier.max) return tier;
  }
  return tiers[tiers.length - 1];
}

export function getMachineDisplayName(machineId: string): string {
  const overrides: Record<string, string> = {
    crafting_table: "Crafting Table",
    furnace: "Furnace",
    ae2_inscriber: "AE2 Inscriber",
  };
  if (overrides[machineId]) return overrides[machineId];

  let name = machineId;
  for (const prefix of [
    "gt.recipe.",
    "gtpp.recipe.",
    "bw.recipe.",
    "gg.recipe.",
    "gtnhlanth.recipe.",
    "kubatech.",
    "bw.fuels.",
    "ggfab.recipe.",
  ]) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  }
  if (name.startsWith("forestry_")) name = "Forestry " + name.slice(9);
  if (name.startsWith("thaumcraft_")) name = "Thaumcraft " + name.slice(11);

  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
