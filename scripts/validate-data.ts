/**
 * Data integrity validation script for GregDex.
 * Run with: npm run validate-data
 *
 * Checks:
 *  1. (WARN)  :32767 wildcard items appear before :0 variants in items-index.json
 *  2. (WARN)  :32767 items with 0 output recipes when :0 has outputs (fallback needed)
 *  3. (ERROR) Recipe chunk refs point to missing files or out-of-bounds indices
 *  4. (WARN)  Fluids referenced in recipes but not in fluids-index.json
 *  5. (ERROR) Items referenced in blood-magic.json have no file in public/data/items/
 *  6. (ERROR) Items in items-index.json have no file in public/data/items/
 *
 * Exits with code 1 if any ERRORs are found, 0 otherwise.
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "public", "data");
const ITEMS_DIR = path.join(DATA_DIR, "items");
const RECIPES_DIR = path.join(DATA_DIR, "recipes");

// ─── Helpers ────────────────────────────────────────────────────────────────

function readJSON<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

/**
 * Matches the encoding used by process-data.ts when creating item files.
 * NOTE: This is intentionally different from src/lib/encoding.ts which also
 * replaces pipe characters. That discrepancy is flagged by checkPipeIds().
 */
function encodeItemId(id: string): string {
  return Buffer.from(id).toString("base64url");
}

function itemFilePath(id: string): string {
  return path.join(ITEMS_DIR, `${encodeItemId(id)}.json`);
}

function fileExists(p: string): boolean {
  return fs.existsSync(p);
}

let errorCount = 0;
let warnCount = 0;

function error(msg: string) {
  console.error(`  [ERROR] ${msg}`);
  errorCount++;
}

function warn(msg: string) {
  console.warn(`  [WARN]  ${msg}`);
  warnCount++;
}

function ok(msg: string) {
  console.log(`  [OK]    ${msg}`);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ItemIndexEntry {
  id: string;
  displayName: string;
  modId: string;
}

interface RecipeRef {
  machine: string;
  chunk: number;
  index: number;
}

interface ItemFile {
  id: string;
  recipesAsOutput: RecipeRef[];
  recipesAsInput: RecipeRef[];
}

interface FluidEntry {
  name: string;
  displayName: string;
}

interface BloodMagicItem {
  id: string;
  displayName: string;
  amount: number;
}

interface AltarRecipe {
  input: BloodMagicItem;
  output: BloodMagicItem;
}

interface AlchemyRecipe {
  output: BloodMagicItem;
  inputs: BloodMagicItem[];
}

interface BloodMagic {
  altarRecipes: AltarRecipe[];
  alchemyRecipes: AlchemyRecipe[];
}

interface MachineEntry {
  id: string;
  chunks: number;
}

// ─── Check 1: :32767 ordering violations ────────────────────────────────────

function checkWildcardOrdering(index: ItemIndexEntry[]): void {
  console.log("\nCheck 1: :32767 wildcard ordering in items-index.json");

  const posMap = new Map<string, number>();
  index.forEach((item, i) => posMap.set(item.id, i));

  const violations: Array<{ id: string; wildcardPos: number; zeroPos: number }> = [];

  for (const [id, pos] of posMap) {
    if (!id.endsWith(":32767")) continue;
    const zeroId = id.slice(0, -6) + ":0";
    const zeroPos = posMap.get(zeroId);
    if (zeroPos !== undefined && pos < zeroPos) {
      violations.push({ id, wildcardPos: pos, zeroPos });
    }
  }

  if (violations.length > 0) {
    warn(
      `${violations.length} items where :32767 appears before :0 in items-index.json.` +
        ` Client-side sort in GlobalSearch.tsx is masking these.`
    );
    // Show first few examples
    violations.slice(0, 5).forEach((v) =>
      console.warn(`           e.g. ${v.id} at pos ${v.wildcardPos} vs :0 at pos ${v.zeroPos}`)
    );
  } else {
    ok(":32767 ordering — no violations (process-data sorts correctly)");
  }
}

// ─── Check 2: :32767 fallback needed ────────────────────────────────────────

function checkWildcardFallback(index: ItemIndexEntry[]): void {
  console.log("\nCheck 2: :32767 items that need the :0 fallback");

  const idSet = new Set(index.map((i) => i.id));
  let fallbackNeeded = 0;
  let checked = 0;

  for (const item of index) {
    if (!item.id.endsWith(":32767")) continue;
    const zeroId = item.id.slice(0, -6) + ":0";
    if (!idSet.has(zeroId)) continue;

    const wildPath = itemFilePath(item.id);
    const zeroPath = itemFilePath(zeroId);
    if (!fileExists(wildPath) || !fileExists(zeroPath)) continue;

    checked++;
    const wildFile = readJSON<ItemFile>(wildPath);
    const zeroFile = readJSON<ItemFile>(zeroPath);

    if (
      (!wildFile.recipesAsOutput || wildFile.recipesAsOutput.length === 0) &&
      zeroFile.recipesAsOutput?.length > 0
    ) {
      fallbackNeeded++;
    }
  }

  if (fallbackNeeded > 0) {
    warn(
      `${fallbackNeeded} of ${checked} :32767 items have 0 output recipes but their :0 variant has outputs.` +
        ` Client-side fallback in ItemDetailClient.tsx is required for these.`
    );
  } else {
    ok(`:32767 fallback — 0 of ${checked} dual-variant pairs need it`);
  }
}

// ─── Check 3: Recipe chunk integrity ────────────────────────────────────────

function checkRecipeChunks(): void {
  console.log("\nCheck 3: Recipe chunk integrity");

  // Preload all chunk files into memory
  const chunkMap = new Map<string, unknown[]>();
  const machineDirs = fs.readdirSync(RECIPES_DIR);

  for (const machineId of machineDirs) {
    const machineDir = path.join(RECIPES_DIR, machineId);
    if (!fs.statSync(machineDir).isDirectory()) continue;
    const chunkFiles = fs.readdirSync(machineDir).filter((f) => f.endsWith(".json"));
    for (const chunkFile of chunkFiles) {
      const key = `${machineId}/${chunkFile.replace(".json", "")}`;
      const data = readJSON<unknown[]>(path.join(machineDir, chunkFile));
      chunkMap.set(key, data);
    }
  }

  // Scan all item files
  const itemFiles = fs.readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".json"));
  let refCount = 0;
  let missingChunks = 0;
  let outOfBounds = 0;

  for (const file of itemFiles) {
    const itemFile = readJSON<ItemFile>(path.join(ITEMS_DIR, file));
    const refs = [
      ...(itemFile.recipesAsOutput || []),
      ...(itemFile.recipesAsInput || []),
    ];

    for (const ref of refs) {
      refCount++;
      const key = `${ref.machine}/chunk-${ref.chunk}`;
      const chunk = chunkMap.get(key);

      if (!chunk) {
        missingChunks++;
        if (missingChunks <= 5) error(`Missing chunk: ${key} (referenced by ${file})`);
      } else if (chunk[ref.index] === undefined) {
        outOfBounds++;
        if (outOfBounds <= 5)
          error(`Index out of bounds: ${key}[${ref.index}] (chunk length ${chunk.length})`);
      }
    }
  }

  if (missingChunks > 0) error(`${missingChunks} total missing chunk file references`);
  if (outOfBounds > 0) error(`${outOfBounds} total out-of-bounds recipe indices`);

  if (missingChunks === 0 && outOfBounds === 0) {
    ok(`Recipe chunk integrity — ${refCount.toLocaleString()} refs checked, 0 broken`);
  }
}

// ─── Check 4: Fluid consistency ─────────────────────────────────────────────

function checkFluids(): void {
  console.log("\nCheck 4: Fluid consistency");

  const fluidsIndex = readJSON<FluidEntry[]>(path.join(DATA_DIR, "fluids-index.json"));
  const fluidNames = new Set(fluidsIndex.map((f) => f.name));

  const unknown = new Set<string>();
  const machineDirs = fs.readdirSync(RECIPES_DIR);

  for (const machineId of machineDirs) {
    const machineDir = path.join(RECIPES_DIR, machineId);
    if (!fs.statSync(machineDir).isDirectory()) continue;
    const chunkFiles = fs.readdirSync(machineDir).filter((f) => f.endsWith(".json"));

    for (const chunkFile of chunkFiles) {
      const recipes = readJSON<any[]>(path.join(machineDir, chunkFile));
      for (const recipe of recipes) {
        for (const fluid of [
          ...(recipe.fluidInputs || []),
          ...(recipe.fluidOutputs || []),
        ]) {
          if (fluid?.name && !fluidNames.has(fluid.name)) {
            unknown.add(fluid.name);
          }
        }
      }
    }
  }

  if (unknown.size > 0) {
    warn(`${unknown.size} fluid names in recipes not found in fluids-index.json`);
    Array.from(unknown)
      .slice(0, 5)
      .forEach((f) => console.warn(`           e.g. "${f}"`));
  } else {
    ok(`Fluid consistency — all recipe fluids exist in fluids-index.json`);
  }
}

// ─── Check 5: Blood magic item linkage ──────────────────────────────────────

function checkBloodMagic(): void {
  console.log("\nCheck 5: Blood magic item linkage");

  const bm = readJSON<BloodMagic>(path.join(DATA_DIR, "blood-magic.json"));
  const missing: string[] = [];

  const allIds = new Set<string>();
  for (const r of bm.altarRecipes) {
    allIds.add(r.input.id);
    allIds.add(r.output.id);
  }
  for (const r of bm.alchemyRecipes) {
    allIds.add(r.output.id);
    for (const inp of r.inputs || []) allIds.add(inp.id);
  }

  for (const id of allIds) {
    if (!fileExists(itemFilePath(id))) {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    missing.slice(0, 5).forEach((id) => error(`Blood magic item has no file: ${id}`));
    if (missing.length > 5)
      error(`...and ${missing.length - 5} more blood magic items missing`);
  } else {
    ok(`Blood magic — all ${allIds.size} referenced items have files`);
  }
}

// ─── Check 6a: Pipe character ID mismatch ────────────────────────────────────

/**
 * process-data.ts encodes IDs as raw base64url (preserving '|').
 * src/lib/encoding.ts (used by the client) replaces '|' with '_' first.
 * Items with '|' in their IDs will 404 on the client because the client
 * generates a different path than the file on disk.
 */
function checkPipeIds(index: ItemIndexEntry[]): void {
  console.log("\nCheck 6a: Items with pipe '|' in ID (client encoding mismatch)");

  const pipeItems = index.filter((item) => item.id.includes("|"));

  if (pipeItems.length > 0) {
    warn(
      `${pipeItems.length} items have '|' in their ID. The client-side encodeId() in` +
        ` src/lib/encoding.ts replaces '|' with '_', generating a different path than` +
        ` what process-data.ts wrote to disk. These items will 404 in the browser.`
    );
    pipeItems.slice(0, 5).forEach((item) =>
      console.warn(`           e.g. ${item.id} (${item.displayName})`)
    );
  } else {
    ok("Pipe '|' in IDs — no items affected");
  }
}

// ─── Check 6: items-index ↔ items/ directory ─────────────────────────────────

function checkIndexVsFiles(index: ItemIndexEntry[]): void {
  console.log("\nCheck 6: items-index.json ↔ items/ directory consistency");

  let missing = 0;
  const examples: string[] = [];

  for (const item of index) {
    if (!fileExists(itemFilePath(item.id))) {
      missing++;
      if (examples.length < 5) examples.push(item.id);
    }
  }

  if (missing > 0) {
    examples.forEach((id) => error(`Item in index has no file: ${id}`));
    if (missing > 5) error(`...and ${missing - 5} more items in index have no files`);
  } else {
    ok(`Index ↔ files — all ${index.length.toLocaleString()} indexed items have files`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("GregDex data validation");
  console.log("=".repeat(50));

  const index = readJSON<ItemIndexEntry[]>(
    path.join(DATA_DIR, "items-index.json")
  );
  console.log(`Loaded items-index.json: ${index.length.toLocaleString()} items`);

  checkWildcardOrdering(index);
  checkWildcardFallback(index);
  checkRecipeChunks();
  checkFluids();
  checkBloodMagic();
  checkPipeIds(index);
  checkIndexVsFiles(index);

  console.log("\n" + "=".repeat(50));
  if (errorCount > 0) {
    console.error(`FAILED: ${errorCount} error(s), ${warnCount} warning(s)`);
    process.exit(1);
  } else {
    console.log(`PASSED: 0 errors, ${warnCount} warning(s)`);
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
