import Link from "next/link";
import {
  getItemsIndex,
  getMachines,
  getMaterials,
  getBeeMutations,
  getOreVeins,
  getFluidsIndex,
} from "@/lib/data";

const quickLinks = [
  {
    title: "Items",
    desc: "Search and browse all 47k+ items",
    href: "/items",
    color: "text-accent-primary",
    bg: "bg-accent-primary/10",
    border: "border-accent-primary/20",
  },
  {
    title: "Machines",
    desc: "Browse machines and their recipes",
    href: "/machines",
    color: "text-accent-secondary",
    bg: "bg-accent-secondary/10",
    border: "border-accent-secondary/20",
  },
  {
    title: "Materials",
    desc: "GregTech material database",
    href: "/materials",
    color: "text-accent-success",
    bg: "bg-accent-success/10",
    border: "border-accent-success/20",
  },
  {
    title: "Fluids & Gases",
    desc: "All fluids with recipes and properties",
    href: "/fluids-gases",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
  },
  {
    title: "Bee Breeding",
    desc: "Mutation trees and species info",
    href: "/bees",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  {
    title: "Ore Veins",
    desc: "Vein distributions by dimension",
    href: "/ores",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    title: "Blood Magic",
    desc: "Altar and alchemy recipes",
    href: "/blood-magic",
    color: "text-accent-danger",
    bg: "bg-accent-danger/10",
    border: "border-accent-danger/20",
  },
  {
    title: "Loot Bags",
    desc: "Drop tables and upgrade recipes for all loot bags",
    href: "/lootbags",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
];

export default function HomePage() {
  let items: { id: string }[] = [];
  let machines: { recipeCount: number }[] = [];
  let materials: unknown[] = [];
  let beeMutations: unknown[] = [];
  let oreVeins: unknown[] = [];
  let fluids: unknown[] = [];
  try {
    items = getItemsIndex();
    machines = getMachines();
    materials = getMaterials();
    beeMutations = getBeeMutations();
    oreVeins = getOreVeins();
    fluids = getFluidsIndex();
  } catch {
    // data not yet generated
  }
  const totalRecipes = machines.reduce((sum, m) => sum + m.recipeCount, 0);

  const stats = [
    { label: "Items", value: items.length.toLocaleString(), href: "/items" },
    { label: "Recipes", value: totalRecipes.toLocaleString(), href: "/machines" },
    { label: "Machines", value: machines.length.toLocaleString(), href: "/machines" },
    { label: "Fluids", value: fluids.length.toLocaleString(), href: "/fluids-gases" },
    { label: "Materials", value: materials.length.toLocaleString(), href: "/materials" },
    { label: "Bee Mutations", value: beeMutations.length.toLocaleString(), href: "/bees" },
    { label: "Ore Veins", value: oreVeins.length.toLocaleString(), href: "/ores" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Greg<span className="text-accent-primary">Dex</span>
        </h1>
        <p className="text-text-secondary text-sm sm:text-base max-w-md mx-auto">
          A "mostly" complete item and recipe database for GregTech: New Horizons
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-10">
        {stats.map((stat) => (
          <Link prefetch={false}
            key={stat.label}
            href={stat.href}
            className="bg-bg-tertiary border border-border-default rounded-lg p-3 text-center hover:border-border-bright transition-colors"
          >
            <div className="text-lg sm:text-xl font-bold text-accent-primary">
              {stat.value}
            </div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold mb-4 text-text-primary">Browse</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link prefetch={false}
            key={link.href}
            href={link.href}
            className={`${link.bg} border ${link.border} rounded-xl p-5 hover:scale-[1.02] transition-transform`}
          >
            <h3 className={`font-semibold ${link.color} mb-1`}>{link.title}</h3>
            <p className="text-sm text-text-secondary">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Tools Section */}
      <h2 className="text-lg font-semibold mb-4 mt-10 text-text-primary">Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link prefetch={false}
          href="/tools/planner"
          className="bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-5 hover:scale-[1.02] transition-transform"
        >
          <h3 className="font-semibold text-accent-primary mb-1">Recipe Planner</h3>
          <p className="text-sm text-text-secondary">
            Node-based editor to plan and validate multi-machine processing chains
          </p>
        </Link>
        <Link prefetch={false}
          href="/tools/overclock"
          className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-5 hover:scale-[1.02] transition-transform"
        >
          <h3 className="font-semibold text-amber-400 mb-1">Overclock Calculator</h3>
          <p className="text-sm text-text-secondary">
            Calculate overclocked EU/t and duration across voltage tiers for any recipe
          </p>
        </Link>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-10 text-center text-text-muted text-sm">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded border border-border-default text-xs">
          Ctrl+K
        </kbd>{" "}
        to search anywhere
      </div>
    </div>
  );
}
