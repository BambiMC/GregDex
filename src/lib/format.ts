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

const MACHINE_NAME_OVERRIDES: Record<string, string> = {
  // Vanilla / misc
  crafting_table: "Crafting Table",
  furnace: "Furnace",
  ae2_inscriber: "AE2 Inscriber",
  // GregTech single-block
  "gt.recipe.fluidsolidifier": "Fluid Solidifier",
  "gt.recipe.fluidcanner": "Fluid Canner",
  "gt.recipe.fluidextractor": "Fluid Extractor",
  "gt.recipe.fluidheater": "Fluid Heater",
  "gt.recipe.alloysmelter": "Alloy Smelter",
  "gt.recipe.arcfurnace": "Arc Furnace",
  "gt.recipe.plasmaarcfurnace": "Plasma Arc Furnace",
  "gt.recipe.cuttingsaw": "Cutting Machine",
  "gt.recipe.metalbender": "Bending Machine",
  "gt.recipe.chemicalreactor": "Chemical Reactor",
  "gt.recipe.largechemicalreactor": "Large Chemical Reactor",
  "gt.recipe.circuitassembler": "Circuit Assembler",
  "gt.recipe.chemicalbath": "Chemical Bath",
  "gt.recipe.thermalcentrifuge": "Thermal Centrifuge",
  "gt.recipe.orewasher": "Ore Washer",
  "gt.recipe.laserengraver": "Laser Engraver",
  "gt.recipe.distillationtower": "Distillation Tower",
  "gt.recipe.implosioncompressor": "Implosion Compressor",
  "gt.recipe.electricimplosioncompressor": "Electric Implosion Compressor",
  "gt.recipe.blastfurnace": "Electric Blast Furnace",
  "gt.recipe.primitiveblastfurnace": "Primitive Blast Furnace",
  "gt.recipe.vacuumfreezer": "Vacuum Freezer",
  "gt.recipe.fakeassemblylineprocess": "Assembly Line",
  "gt.recipe.researchstation": "Research Station",
  "gt.recipe.pyro": "Pyrolyse Oven",
  "gt.recipe.craker": "Oil Cracking Unit",
  "gt.recipe.massfab": "Mass Fabricator",
  "gt.recipe.neutroniumcompressor": "Neutronium Compressor",
  "gt.recipe.eyeofharmony": "Eye of Harmony",
  "gt.recipe.nanoforge": "Nano Forge",
  "gt.recipe.plasmaforge": "Plasma Forge",
  "gt.recipe.pcbfactory": "PCB Factory",
  "gt.recipe.spaceassembler": "Space Assembler",
  "gt.recipe.spacemining": "Space Mining",
  "gt.recipe.fakespaceprojects": "Space Projects",
  "gt.recipe.transcendentplasmamixerrecipes": "Transcendent Plasma Mixer",
  "gt.recipe.rockbreaker": "Rock Breaker",
  "gt.recipe.slicer": "Precision Slicer",
  "gt.recipe.printer": "Printer",
  "gt.recipe.ic2nuke": "IC2 Nuke",
  "gt.recipe.uuamplifier": "UU Amplifier",
  "gt.recipe.replicator": "Replicator",
  "gt.recipe.upgrade_costs": "Upgrade Costs",
  // GregTech fuel/generator recipes
  "gt.recipe.gasturbinefuel": "Gas Turbine Fuel",
  "gt.recipe.dieselgeneratorfuel": "Diesel Generator Fuel",
  "gt.recipe.extremedieselgeneratorfuel": "Extreme Diesel Generator Fuel",
  "gt.recipe.thermalgeneratorfuel": "Thermal Generator Fuel",
  "gt.recipe.semifluidgeneratorfuels": "Semi-Fluid Generator Fuel",
  "gt.recipe.semifluidboilerfuels": "Semi-Fluid Boiler Fuel",
  "gt.recipe.largeboilerfakefuels": "Large Boiler Fuel",
  "gt.recipe.plasmageneratorfuels": "Plasma Generator Fuel",
  "gt.recipe.magicfuels": "Magic Fuel",
  "gt.recipe.smallnaquadahreactor": "Small Naquadah Reactor",
  "gt.recipe.largenaquadahreactor": "Large Naquadah Reactor",
  "gt.recipe.hugenaquadahreactor": "Huge Naquadah Reactor",
  "gt.recipe.extrahugenaquadahreactor": "Extra Huge Naquadah Reactor",
  "gt.recipe.fluidnaquadahreactor": "Fluid Naquadah Reactor",
  "gt.recipe.fusionreactor": "Fusion Reactor",
  "gt.recipe.fog_molten": "Field of Gold: Molten",
  "gt.recipe.fog_plasma": "Field of Gold: Plasma",
  "gt.recipe.fog_exotic": "Field of Gold: Exotic",
  "gt.recipe.purificationplantozonation": "Purification Plant: Ozonation",
  "gt.recipe.purificationplantclarifier": "Purification Plant: Clarifier",
  "gt.recipe.purificationplantdegasifier": "Purification Plant: Degasifier",
  "gt.recipe.purificationplantflocculation": "Purification Plant: Flocculation",
  "gt.recipe.purificationplantphadjustment": "Purification Plant: pH Adjustment",
  "gt.recipe.purificationplantplasmaheating": "Purification Plant: Plasma Heating",
  "gt.recipe.purificationplantquarkextractor": "Purification Plant: Quark Extractor",
  "gt.recipe.purificationplantuvtreatment": "Purification Plant: UV Treatment",
  // GT++ (GTPP)
  "gtpp.recipe.multicentrifuge": "Industrial Centrifuge",
  "gtpp.recipe.multimixer": "Industrial Mixer",
  "gtpp.recipe.cokeoven": "Coke Oven",
  "gtpp.recipe.simplewasher": "Simple Washer",
  "gtpp.recipe.multielectro": "Industrial Electrolyzer",
  "gtpp.recipe.cryogenicfreezer": "Cryogenic Freezer",
  "gtpp.recipe.alloyblastsmelter": "Alloy Blast Smelter",
  "gtpp.recipe.fluidchemicaleactor": "Fluid Chemical Reactor",
  "gtpp.recipe.treefarm": "Tree Farm",
  "gtpp.recipe.chemicaldehydrator": "Chemical Dehydrator",
  "gtpp.recipe.multidehydrator": "Industrial Dehydrator",
  "gtpp.recipe.oremill": "Industrial Ore Processing Facility",
  "gtpp.recipe.fishpond": "Fish Pond",
  "gtpp.recipe.quantumforcesmelter": "Quantum Force Transformer",
  "gtpp.recipe.cyclotron": "Cyclotron",
  "gtpp.recipe.moleculartransformer": "Molecular Transformer",
  "gtpp.recipe.vacfurnace": "Vacuum Furnace",
  "gtpp.recipe.flotationcell": "Flotation Cell",
  "gtpp.recipe.nuclearsaltprocessingplant": "Nuclear Salt Processing Plant",
  "gtpp.recipe.matterfab2": "Matter Fabricator MK2",
  "gtpp.recipe.reactorprocessingunit": "Reactor Processing Unit",
  "gtpp.recipe.fissionfuel": "Fission Fuel",
  "gtpp.recipe.rtggenerators": "RTG Generator",
  "gtpp.recipe.rocketenginefuel": "Rocket Engine Fuel",
  "gtpp.recipe.lftr": "LFTR",
  "gtpp.recipe.spargetower": "Sparge Tower",
  "gtpp.recipe.coldtrap": "Cold Trap",
  "gtpp.recipe.thermalgeneratorfuel": "Thermal Generator Fuel (GT++)",
  "gtpp.recipe.solartower": "Solar Tower",
  "gtpp.recipe.semifluidgeneratorfuels": "Semi-Fluid Generator Fuel (GT++)",
  // Good Generator (GG)
  "gg.recipe.componentassemblyline": "Component Assembly Line",
  "gg.recipe.extreme_heat_exchanger": "Extreme Heat Exchanger",
  "gg.recipe.naquadah_fuel_refine_factory": "Naquadah Fuel Refinery",
  "gg.recipe.naquadah_reactor": "Naquadah Reactor",
  "gg.recipe.neutron_activator": "Neutron Activator",
  "gg.recipe.precise_assembler": "Precise Assembler",
  // GG Fab
  "ggfab.recipe.toolcast": "Tool Cast",
  // BartWorks (BW)
  "bw.recipe.biolab": "Bio Lab",
  "bw.recipe.radhatch": "Radiation Hatch",
  "bw.recipe.bacteriavat": "Bacteria Vat",
  "bw.recipe.cal": "Contamination Array Lab",
  "bw.recipe.htgr": "HTGR",
  "bw.fuels.acidgens": "Acid Generator",
  // GTNH Lanthanides
  "gtnhlanth.recipe.tc": "Thorium Cell",
  "gtnhlanth.recipe.digester": "Digester",
  "gtnhlanth.recipe.disstank": "Dissolution Tank",
  "gtnhlanth.recipe.sc": "Supercritical Fluid Extractor",
  // KubaTech
  "kubatech.defusioncrafter": "De-Fusion Crafter",
  // Forestry
  forestry_carpenter: "Forestry Carpenter",
  forestry_fermenter: "Forestry Fermenter",
  forestry_squeezer: "Forestry Squeezer",
  forestry_centrifuge: "Forestry Centrifuge",
  forestry_fabricator: "Forestry Fabricator",
  forestry_still: "Forestry Still",
  forestry_moistener: "Forestry Moistener",
  // Thaumcraft
  thaumcraft_arcane_crafting: "Thaumcraft Arcane Crafting",
  thaumcraft_infusion_altar: "Thaumcraft Infusion Altar",
  thaumcraft_crucible: "Thaumcraft Crucible",
};

// Maps machine ID to icon path (filename in /icons/items/)
const MACHINE_ICON_MAP: Record<string, string> = {
  crafting_table: "minecraft_crafting_table_0.png",
  furnace: "minecraft_furnace_0.png",
  ae2_inscriber: "appliedenergistics2_item.itemmultimaterial_13.png",
  // GT single-block
  "gt.recipe.macerator": "gregtech_gt.blockmachines_302.png",
  "gt.recipe.centrifuge": "gregtech_gt.blockmachines_361.png",
  "gt.recipe.extruder": "gregtech_gt.blockmachines_281.png",
  "gt.recipe.electrolyzer": "gregtech_gt.blockmachines_371.png",
  "gt.recipe.mixer": "gregtech_gt.blockmachines_581.png",
  "gt.recipe.lathe": "gregtech_gt.blockmachines_291.png",
  "gt.recipe.wiremill": "gregtech_gt.blockmachines_351.png",
  "gt.recipe.packager": "gregtech_gt.blockmachines_401.png",
  "gt.recipe.unpackager": "gregtech_gt.blockmachines_411.png",
  "gt.recipe.fluidextractor": "gregtech_gt.blockmachines_511.png",
  "gt.recipe.fluidcanner": "gregtech_gt.blockmachines_431.png",
  "gt.recipe.brewer": "gregtech_gt.blockmachines_491.png",
  "gt.recipe.polarizer": "gregtech_gt.blockmachines_551.png",
  "gt.recipe.electromagneticseparator": "gregtech_gt.blockmachines_561.png",
  "gt.recipe.thermalcentrifuge": "gregtech_gt.blockmachines_381.png",
  "gt.recipe.orewasher": "gregtech_gt.blockmachines_391.png",
  "gt.recipe.scanner": "gregtech_gt.blockmachines_341.png",
  "gt.recipe.replicator": "gregtech_gt.blockmachines_481.png",
  "gt.recipe.massfab": "gregtech_gt.blockmachines_461.png",
  "gt.recipe.vacuumfreezer": "gregtech_gt.blockmachines_1002.png",
  "gt.recipe.blastfurnace": "gregtech_gt.blockmachines_1000.png",
  "gt.recipe.alloysmelter": "gregtech_gt.blockmachines_211.png",
  "gt.recipe.arcfurnace": "gregtech_gt.blockmachines_831.png",
  "gt.recipe.cuttingsaw": "gregtech_gt.blockmachines_321.png",
  "gt.recipe.hammer": "gregtech_gt.blockmachines_221.png",
  "gt.recipe.chemicalreactor": "gregtech_gt.blockmachines_421.png",
  "gt.recipe.compressor": "gregtech_gt.blockmachines_241.png",
  "gt.recipe.press": "gregtech_gt.blockmachines_231.png",
  "gt.recipe.fluidsolidifier": "gregtech_gt.blockmachines_522.png",
  "gt.recipe.distillery": "gregtech_gt.blockmachines_535.png",
  "gt.recipe.circuitassembler": "gregtech_gt.blockmachines_1185.png",
  "gt.recipe.laserengraver": "gregtech_gt.blockmachines_3004.png",
  "gt.recipe.autoclave": "gregtech_gt.blockmachines_10790.png",
  "gt.recipe.assembler": "gregtech_gt.blockmachines_32018.png",
  "gt.recipe.distillationtower": "gregtech_gt.blockmachines_1126.png",
  "gt.recipe.chemicalbath": "gregtech_gt.blockmachines_541.png",
  "gt.recipe.sifter": "gregtech_gt.blockmachines_601.png",
  "gt.recipe.craker": "gregtech_gt.blockmachines_1004.png",
  "gt.recipe.implosioncompressor": "gregtech_gt.blockmachines_12734.png",
  "gt.recipe.electricimplosioncompressor": "gregtech_gt.blockmachines_12734.png",
  "gt.recipe.largechemicalreactor": "gregtech_gt.blockmachines_421.png",
  "gt.recipe.plasmaarcfurnace": "gregtech_gt.blockmachines_662.png",
  "gt.recipe.eyeofharmony": "gregtech_gt.blockmachines_15410.png",
  "gt.recipe.nanoforge": "gregtech_gt.blockmachines_357.png",
  "gt.recipe.plasmaforge": "gregtech_gt.blockmachines_1004.png",
  "gt.recipe.fakeassemblylineprocess": "gregtech_gt.blockmachines_15442.png",
  "gt.recipe.researchstation": "gregtech_gt.blockmachines_356.png",
  "gt.recipe.pcbfactory": "gregtech_gt.blockmachines_356.png",
  "gt.recipe.fusionreactor": "gregtech_gt.blockmachines_1193.png",
  "gt.recipe.biolab": "gregtech_gt.blockmachines_12699.png",
  // GT++
  "gtpp.recipe.multicentrifuge": "gregtech_gt.blockmachines_790.png",
  "gtpp.recipe.multielectro": "gregtech_gt.blockmachines_796.png",
  "gtpp.recipe.cryogenicfreezer": "gregtech_gt.blockmachines_910.png",
  "gtpp.recipe.alloyblastsmelter": "gregtech_gt.blockmachines_810.png",
  "gtpp.recipe.chemicaldehydrator": "gregtech_gt.blockmachines_815.png",
  "gtpp.recipe.moleculartransformer": "gregtech_gt.blockmachines_31072.png",
  "gtpp.recipe.coldtrap": "gregtech_gt.blockmachines_31033.png",
  // GG
  "gg.recipe.componentassemblyline": "goodgenerator_componentassemblylinecasing_0.png",
  // BW
  "bw.recipe.biolab": "gregtech_gt.blockmachines_12699.png",
  // Forestry
  forestry_fermenter: "forestry_factory_3.png",
  forestry_squeezer: "forestry_factory_5.png",
  forestry_moistener: "forestry_factory_4.png",
};

export function getMachineDisplayName(machineId: string): string {
  if (MACHINE_NAME_OVERRIDES[machineId]) return MACHINE_NAME_OVERRIDES[machineId];

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

export function getMachineIconPath(machineId: string): string | null {
  return MACHINE_ICON_MAP[machineId] ? `/icons/items/${MACHINE_ICON_MAP[machineId]}` : null;
}
