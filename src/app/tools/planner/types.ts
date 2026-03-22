export interface RecipeData {
  machine: string;
  recipeType: string;
  euPerTick?: number;
  duration?: number;
  itemInputs: (RecipeItemData | null)[];
  fluidInputs: RecipeFluidData[];
  itemOutputs: RecipeItemData[];
  fluidOutputs: RecipeFluidData[];
}

export interface RecipeItemData {
  id: string;
  displayName: string;
  amount: number;
}

export interface RecipeFluidData {
  name: string;
  displayName: string;
  amount: number;
}

export interface PlannerNode {
  id: string;
  position: { x: number; y: number };
  recipe: RecipeData | null;
  label: string;
  collapsed: boolean;
}

export interface PlannerEdge {
  id: string;
  sourceNodeId: string;
  sourceHandle: string; // e.g. "item-out-0", "fluid-out-1"
  targetNodeId: string;
  targetHandle: string; // e.g. "item-in-0", "fluid-in-0"
}

export interface ValidationIssue {
  nodeId: string;
  type: "error" | "warning" | "info";
  message: string;
}

export interface HandleInfo {
  nodeId: string;
  handle: string;
  side: "input" | "output";
  kind: "item" | "fluid";
  rect: DOMRect;
}
