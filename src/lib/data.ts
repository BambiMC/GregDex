import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

const cache = new Map<string, unknown>();

function readCached<T>(filePath: string): T {
  if (cache.has(filePath)) return cache.get(filePath) as T;
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  cache.set(filePath, data);
  return data;
}

export function encodeItemId(id: string): string {
  return Buffer.from(id).toString("base64url");
}

export function decodeItemId(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString();
}

export function getItemsIndex() {
  return readCached<{ id: string; displayName: string; modId: string }[]>(
    path.join(DATA_DIR, "items-index.json")
  );
}

export function getItem(encodedId: string) {
  const filePath = path.join(DATA_DIR, "items", `${encodedId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return readCached<any>(filePath);
}

export function getFluidsIndex() {
  return readCached<{ name: string; displayName: string }[]>(
    path.join(DATA_DIR, "fluids-index.json")
  );
}

export function getMachines() {
  return readCached<
    {
      id: string;
      displayName: string;
      recipeCount: number;
      chunks: number;
      category: string;
    }[]
  >(path.join(DATA_DIR, "machines.json"));
}

export function getRecipeChunk(machineId: string, chunk: number) {
  const filePath = path.join(
    DATA_DIR,
    "recipes",
    machineId,
    `chunk-${chunk}.json`
  );
  if (!fs.existsSync(filePath)) return [];
  return readCached<any[]>(filePath);
}

export function getMaterials() {
  return readCached<any[]>(path.join(DATA_DIR, "materials.json"));
}

export function getBeeMutations() {
  return readCached<any[]>(path.join(DATA_DIR, "bee-mutations.json"));
}

export function getBeeSpecies() {
  return readCached<any[]>(path.join(DATA_DIR, "bee-species.json"));
}

export function getOreVeins() {
  return readCached<any[]>(path.join(DATA_DIR, "ore-veins.json"));
}

export function getSmallOres() {
  return readCached<any[]>(path.join(DATA_DIR, "small-ores.json"));
}

export function getBloodMagic() {
  return readCached<any>(path.join(DATA_DIR, "blood-magic.json"));
}

export function getTrigramIndex() {
  return readCached<Record<string, number[]>>(
    path.join(DATA_DIR, "search", "items-trigrams.json")
  );
}

export function getItemsByMod() {
  return readCached<Record<string, { id: string; displayName: string }[]>>(
    path.join(DATA_DIR, "search", "items-by-mod.json")
  );
}
