import fs from "fs";
import path from "path";
import { GTNH_VERSIONS } from "@/types/versions";

function getDataDir(version?: string): string {
  const versionConfig = version
    ? GTNH_VERSIONS.find((v) => v.id === version)
    : GTNH_VERSIONS.find((v) => v.isDefault);

  return path.join(process.cwd(), versionConfig?.dataPath || "data");
}

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
