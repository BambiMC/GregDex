import fs from "fs";
import path from "path";
import { GTNH_VERSIONS } from "@/types/versions";

function getDataDir(version?: string): string {
  const versionConfig = version
    ? GTNH_VERSIONS.find((v) => v.id === version)
    : GTNH_VERSIONS.find((v) => v.isDefault);

  const basePath = versionConfig?.dataPath || "data";
  const fullPath = path.join(process.cwd(), basePath);

  // Check if data exists in the expected location
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  // Try alternative paths for different deployment environments
  const alternativePaths = [
    path.join(process.cwd(), ".next", basePath),
    path.join("/var/task", basePath),
    path.join("/vercel/path0", basePath),
  ];

  for (const altPath of alternativePaths) {
    if (fs.existsSync(altPath)) {
      console.log("Found data at alternative path:", altPath);
      return altPath;
    }
  }

  console.error("Data directory not found at any of these paths:", [
    fullPath,
    ...alternativePaths,
  ]);
  return fullPath; // Return original path as fallback
}

const cache = new Map<string, unknown>();

function readCached<T>(filePath: string): T {
  if (cache.has(filePath)) return cache.get(filePath) as T;

  try {
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      throw new Error(`File not found: ${filePath}`);
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    cache.set(filePath, data);
    return data;
  } catch (error) {
    console.error("Error reading file:", filePath, error);
    throw error;
  }
}

export function encodeItemId(id: string): string {
  return Buffer.from(id).toString("base64url");
}

export function decodeItemId(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString();
}

export function createReadableItemId(id: string): string {
  // Convert item IDs like "gregtech:gt.metaitem.01:32741" to readable format
  // Replace colons with hyphens, but keep dots as dots
  return id.replace(/:/g, "-");
}

export function parseReadableItemId(readableId: string): string {
  // Convert readable format back to original item ID
  // Replace hyphens back to colons
  return readableId.replace(/-/g, ":");
}

export function isReadableItemId(id: string): boolean {
  // Check if this looks like a readable ID (contains hyphens but no colons)
  // OR if it's a simple fluid name without special encoding characters
  // OR if it contains commas (for fluid names like "1,1dimethylhydrazine")
  const hasHyphensNoColons = id.includes("-") && !id.includes(":");
  const hasCommas = id.includes(",");
  const isSimpleFluidName = !id.includes(":") && !id.match(/[A-Za-z0-9]{20,}/); // Not base64-like
  return hasHyphensNoColons || hasCommas || isSimpleFluidName;
}

export function getItemsIndex(version?: string) {
  return readCached<{ id: string; displayName: string; modId: string }[]>(
    path.join(getDataDir(version), "items-index.json"),
  );
}

export function getItem(encodedId: string, version?: string) {
  const filePath = path.join(getDataDir(version), "items", `${encodedId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return readCached<any>(filePath);
}

export function getFluidsIndex(version?: string) {
  return readCached<{ name: string; displayName: string }[]>(
    path.join(getDataDir(version), "fluids-index.json"),
  );
}

export function getMachines(version?: string) {
  return readCached<
    {
      id: string;
      displayName: string;
      recipeCount: number;
      chunks: number;
      category: string;
    }[]
  >(path.join(getDataDir(version), "machines.json"));
}

export function getRecipeChunk(
  machineId: string,
  chunk: number,
  version?: string,
) {
  const filePath = path.join(
    getDataDir(version),
    "recipes",
    machineId,
    `chunk-${chunk}.json`,
  );
  if (!fs.existsSync(filePath)) return [];
  return readCached<any[]>(filePath);
}

export function getMaterials(version?: string) {
  return readCached<any[]>(path.join(getDataDir(version), "materials.json"));
}

export function getBeeMutations(version?: string) {
  return readCached<any[]>(
    path.join(getDataDir(version), "bee-mutations.json"),
  );
}

export function getBeeSpecies(version?: string) {
  return readCached<any[]>(path.join(getDataDir(version), "bee-species.json"));
}

export function getOreVeins(version?: string) {
  return readCached<any[]>(path.join(getDataDir(version), "ore-veins.json"));
}

export function getSmallOres(version?: string) {
  return readCached<any[]>(path.join(getDataDir(version), "small-ores.json"));
}

export function getBloodMagic(version?: string) {
  return readCached<any>(path.join(getDataDir(version), "blood-magic.json"));
}

export function getTrigramIndex(version?: string) {
  return readCached<Record<string, number[]>>(
    path.join(getDataDir(version), "search", "items-trigrams.json"),
  );
}

export function getItemsByMod(version?: string) {
  return readCached<Record<string, { id: string; displayName: string }[]>>(
    path.join(getDataDir(version), "search", "items-by-mod.json"),
  );
}
