// === Items ===
export interface RawItem {
  modId: string;
  itemName: string;
  metadata: number;
  displayName: string;
  unlocalizedName: string;
  oreDictNames?: string[];
}

export interface ItemIndex {
  id: string;
  displayName: string;
  modId: string;
}

export interface ProcessedItem extends RawItem {
  id: string;
  recipesAsOutput: RecipeRef[];
  recipesAsInput: RecipeRef[];
}

export interface RecipeRef {
  machine: string;
  chunk: number;
  index: number;
}

// === Fluids ===
export interface Fluid {
  name: string;
  displayName: string;
}

export interface ProcessedFluid extends Fluid {
  recipesAsOutput: RecipeRef[];
  recipesAsInput: RecipeRef[];
}

// === Recipes ===
export interface RecipeItem {
  id: string;
  displayName: string;
  amount: number;
}

export interface RecipeFluid {
  name: string;
  displayName: string;
  amount: number;
}

export interface Recipe {
  machine: string;
  recipeType: string;
  euPerTick?: number;
  duration?: number;
  itemInputs: (RecipeItem | null)[];
  fluidInputs: RecipeFluid[];
  itemOutputs: RecipeItem[];
  fluidOutputs: RecipeFluid[];
  gridWidth?: number;
  gridHeight?: number;
  // Thaumcraft extras
  aspects?: Record<string, number>;
  research?: string;
}

// === Machines ===
export interface MachineInfo {
  id: string;
  displayName: string;
  recipeCount: number;
  chunks: number;
  category: string;
}

// === Materials ===
export interface Material {
  name: string;
  localizedName: string;
  chemicalFormula?: string;
  density?: number;
  mass?: number;
  oreValue?: number;
  toolSpeed?: number;
  toolQuality?: number;
  toolDurability?: number;
  meltingPoint?: number;
  blastFurnaceTemp?: number;
  gasTemp?: number;
  processingTierEU?: number;
}

// === Bees ===
export interface BeeMutation {
  parent1Uid: string;
  parent1Name: string;
  parent2Uid: string;
  parent2Name: string;
  offspringUid: string;
  offspringName: string;
  chance: number;
  conditions: string[];
}

export interface BeeSpecies {
  uid: string;
  binomial: string;
  branch: string;
  temperature: string;
  humidity: string;
  nocturnal: boolean;
  products: BeeProduct[];
}

export interface BeeProduct {
  id: string;
  displayName: string;
  chance: number;
}

// === Ores ===
export interface OreInfo {
  meta: number;
  materialName: string;
}

export interface OreVein {
  name: string;
  minY: number;
  maxY: number;
  weight: number;
  density: number;
  size: number;
  primaryOre: OreInfo;
  secondaryOre: OreInfo;
  betweenOre: OreInfo;
  sporadicOre: OreInfo;
  dimensions: string[];
  restrictBiome: string;
}

export interface SmallOre {
  name: string;
  minY: number;
  maxY: number;
  amount: number;
  ore: OreInfo;
  dimensions: string[];
  biome: string;
}

// === Blood Magic ===
export interface BloodMagicAltarRecipe {
  input: RecipeItem;
  output: RecipeItem;
  minTier: number;
  liquidRequired: number;
  consumptionRate: number;
  drainRate: number;
}

export interface BloodMagicAlchemyRecipe {
  output: RecipeItem;
  orbLevel: number;
  inputs: RecipeItem[];
}

// === Search ===
export interface SearchResult {
  id: string;
  displayName: string;
  modId?: string;
  type: "item" | "fluid";
  score: number;
}

// === API ===
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
