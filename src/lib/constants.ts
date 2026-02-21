export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/items", label: "Items", icon: "cube" },
  { href: "/machines", label: "Machines", icon: "cog" },
  { href: "/materials", label: "Materials", icon: "beaker" },
  { href: "/bees", label: "Bees", icon: "bug" },
  { href: "/ores", label: "Ores", icon: "mountain" },
  { href: "/blood-magic", label: "Blood Magic", icon: "droplet" },
] as const;

export const DIMENSIONS = [
  "overworld",
  "nether",
  "end",
  "end_asteroid",
  "twilight_forest",
] as const;

export const DIMENSION_LABELS: Record<string, string> = {
  overworld: "Overworld",
  nether: "Nether",
  end: "The End",
  end_asteroid: "End Asteroids",
  twilight_forest: "Twilight Forest",
};
