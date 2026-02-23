import * as fs from "fs";
import * as path from "path";

const ROOT_DIR = path.join(__dirname, "..");
const NEI_DIR = (() => {
  const match = fs
    .readdirSync(ROOT_DIR)
    .find(
      (f) =>
        f.startsWith("nei_export") &&
        fs.statSync(path.join(ROOT_DIR, f)).isDirectory(),
    );
  if (!match) throw new Error("No nei_export* directory found in project root");
  return path.join(ROOT_DIR, match);
})();
const DATA_DIR = path.join(__dirname, "..", "data");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function encodeItemId(id: string): string {
  return Buffer.from(id).toString("base64url");
}

function readJSON<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data));
}

function getMachineDisplayName(machineId: string): string {
  const overrides: Record<string, string> = {
    crafting_table: "Crafting Table",
    furnace: "Furnace",
    ae2_inscriber: "AE2 Inscriber",
  };
  if (overrides[machineId]) return overrides[machineId];

  let name = machineId;
  // Strip common prefixes
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
  // Strip forestry_ prefix
  if (name.startsWith("forestry_")) name = "Forestry " + name.slice(9);
  if (name.startsWith("thaumcraft_")) name = "Thaumcraft " + name.slice(11);

  // Title case: split on dots, underscores, camelCase
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function getMachineCategory(machineId: string): string {
  if (machineId.startsWith("gt.recipe.")) return "GregTech";
  if (machineId.startsWith("gtpp.recipe.")) return "GT++";
  if (machineId.startsWith("bw.")) return "BartWorks";
  if (machineId.startsWith("gg.recipe.")) return "GoodGenerator";
  if (machineId.startsWith("gtnhlanth.")) return "GTNH Lanthanides";
  if (machineId.startsWith("kubatech.")) return "KubaTech";
  if (machineId.startsWith("ggfab.")) return "GGFab";
  if (machineId.startsWith("forestry_")) return "Forestry";
  if (machineId.startsWith("thaumcraft_")) return "Thaumcraft";
  if (machineId === "crafting_table" || machineId === "furnace")
    return "Vanilla";
  if (machineId.startsWith("ae2_")) return "Applied Energistics";
  return "Other";
}

async function main() {
  console.log("=== GregDex Data Processing ===\n");

  // Clean output dir
  if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true });
  }
  ensureDir(DATA_DIR);
  ensureDir(path.join(DATA_DIR, "items"));
  ensureDir(path.join(DATA_DIR, "fluids"));
  ensureDir(path.join(DATA_DIR, "recipes"));
  ensureDir(path.join(DATA_DIR, "search"));

  // Step 1: Load and index items
  console.log("Step 1: Processing items...");
  const rawItems = readJSON<Record<string, any>>(
    path.join(NEI_DIR, "items.json"),
  );
  const itemIds = Object.keys(rawItems);
  console.log(`  Found ${itemIds.length} items`);

  const itemsIndex: { id: string; displayName: string; modId: string }[] = [];
  const itemMap = new Map<
    string,
    { data: any; recipesAsOutput: any[]; recipesAsInput: any[] }
  >();

  for (const id of itemIds) {
    const item = rawItems[id];
    itemsIndex.push({
      id,
      displayName: item.displayName,
      modId: item.modId,
    });
    itemMap.set(id, {
      data: { ...item, id },
      recipesAsOutput: [],
      recipesAsInput: [],
    });
  }

  // Step 2: Process recipes and build per-item references
  console.log("\nStep 2: Processing recipes...");
  const recipesDir = path.join(NEI_DIR, "recipes");
  const recipeFiles = fs
    .readdirSync(recipesDir)
    .filter((f) => f.endsWith(".json"));
  console.log(`  Found ${recipeFiles.length} recipe files`);

  const CHUNK_SIZE = 500;
  const machines: {
    id: string;
    displayName: string;
    recipeCount: number;
    chunks: number;
    category: string;
  }[] = [];

  let totalRecipes = 0;

  for (const file of recipeFiles) {
    const machineId = file.replace(".json", "");
    const recipes = readJSON<any[]>(path.join(recipesDir, file));
    totalRecipes += recipes.length;

    // Chunk recipes
    const machineDir = path.join(DATA_DIR, "recipes", machineId);
    ensureDir(machineDir);

    const numChunks = Math.ceil(recipes.length / CHUNK_SIZE);
    for (let c = 0; c < numChunks; c++) {
      const chunk = recipes.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
      writeJSON(path.join(machineDir, `chunk-${c}.json`), chunk);
    }

    machines.push({
      id: machineId,
      displayName: getMachineDisplayName(machineId),
      recipeCount: recipes.length,
      chunks: numChunks,
      category: getMachineCategory(machineId),
    });

    // Build per-item recipe refs
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const chunk = Math.floor(i / CHUNK_SIZE);
      const indexInChunk = i % CHUNK_SIZE;
      const ref = { machine: machineId, chunk, index: indexInChunk };

      // Outputs
      if (recipe.itemOutputs) {
        for (const output of recipe.itemOutputs) {
          if (output?.id) {
            const entry = itemMap.get(output.id);
            if (entry) entry.recipesAsOutput.push(ref);
          }
        }
      }
      if (recipe.fluidOutputs) {
        for (const output of recipe.fluidOutputs) {
          if (output?.name) {
            // Fluid refs handled separately
          }
        }
      }

      // Inputs
      if (recipe.itemInputs) {
        for (const input of recipe.itemInputs) {
          if (input?.id) {
            const entry = itemMap.get(input.id);
            if (entry) entry.recipesAsInput.push(ref);
          }
        }
      }
    }

    process.stdout.write(
      `  Processed ${machineId} (${recipes.length} recipes)\n`,
    );
  }

  console.log(`\n  Total recipes: ${totalRecipes}`);

  // Write machines index
  machines.sort((a, b) => b.recipeCount - a.recipeCount);
  writeJSON(path.join(DATA_DIR, "machines.json"), machines);

  // Step 3: Write per-item files
  console.log("\nStep 3: Writing per-item files...");
  let itemCount = 0;
  for (const [id, entry] of itemMap) {
    const encoded = encodeItemId(id);
    writeJSON(path.join(DATA_DIR, "items", `${encoded}.json`), {
      ...entry.data,
      recipesAsOutput: entry.recipesAsOutput,
      recipesAsInput: entry.recipesAsInput,
    });
    itemCount++;
  }
  console.log(`  Wrote ${itemCount} item files`);

  // Write items index
  writeJSON(path.join(DATA_DIR, "items-index.json"), itemsIndex);

  // Items by mod
  const itemsByMod: Record<string, { id: string; displayName: string }[]> = {};
  for (const item of itemsIndex) {
    if (!itemsByMod[item.modId]) itemsByMod[item.modId] = [];
    itemsByMod[item.modId].push({ id: item.id, displayName: item.displayName });
  }
  writeJSON(path.join(DATA_DIR, "search", "items-by-mod.json"), itemsByMod);

  // Step 4: Process fluids
  console.log("\nStep 4: Processing fluids...");
  const rawFluids = readJSON<Record<string, any>>(
    path.join(NEI_DIR, "fluids.json"),
  );
  const fluidsIndex: { name: string; displayName: string }[] = [];
  for (const [name, fluid] of Object.entries(rawFluids)) {
    fluidsIndex.push({ name, displayName: fluid.displayName });
    writeJSON(path.join(DATA_DIR, "fluids", `${name}.json`), fluid);
  }
  writeJSON(path.join(DATA_DIR, "fluids-index.json"), fluidsIndex);
  console.log(`  Processed ${fluidsIndex.length} fluids`);

  // Step 5: Build trigram search index
  console.log("\nStep 5: Building search index...");
  const trigrams: Record<string, number[]> = {};

  for (let i = 0; i < itemsIndex.length; i++) {
    const name = itemsIndex[i].displayName.toLowerCase();
    const seen = new Set<string>();
    for (let j = 0; j <= name.length - 3; j++) {
      const tri = name.substring(j, j + 3);
      if (!seen.has(tri)) {
        seen.add(tri);
        if (!trigrams[tri]) trigrams[tri] = [];
        trigrams[tri].push(i);
      }
    }
  }

  writeJSON(path.join(DATA_DIR, "search", "items-trigrams.json"), trigrams);
  console.log(`  Built ${Object.keys(trigrams).length} trigram entries`);

  // Step 6: Copy small datasets
  console.log("\nStep 6: Copying small datasets...");

  // Materials
  const materials = readJSON<any[]>(path.join(NEI_DIR, "gt_materials.json"));
  writeJSON(path.join(DATA_DIR, "materials.json"), materials);
  console.log(`  Materials: ${materials.length}`);

  // Bees
  const beeData = readJSON<any>(path.join(NEI_DIR, "bee_breeding.json"));
  writeJSON(path.join(DATA_DIR, "bee-mutations.json"), beeData.mutations || []);
  writeJSON(path.join(DATA_DIR, "bee-species.json"), beeData.species || []);
  console.log(
    `  Bee mutations: ${(beeData.mutations || []).length}, species: ${(beeData.species || []).length}`,
  );

  // Blood Magic
  const bloodMagic = readJSON<any>(path.join(NEI_DIR, "blood_magic.json"));
  writeJSON(path.join(DATA_DIR, "blood-magic.json"), bloodMagic);
  console.log(
    `  Blood Magic: ${(bloodMagic.altarRecipes || []).length} altar, ${(bloodMagic.alchemyRecipes || []).length} alchemy`,
  );

  // Ore veins
  const oreVeins = readJSON<any[]>(path.join(NEI_DIR, "ore_veins.json"));
  writeJSON(path.join(DATA_DIR, "ore-veins.json"), oreVeins);
  console.log(`  Ore veins: ${oreVeins.length}`);

  // Small ores
  const smallOres = readJSON<any[]>(path.join(NEI_DIR, "small_ores.json"));
  writeJSON(path.join(DATA_DIR, "small-ores.json"), smallOres);
  console.log(`  Small ores: ${smallOres.length}`);

  // Copy NEI icons into public/icons/items
  const neiIconsDir = path.join(NEI_DIR, "icons");
  const publicIconsDir = path.join(ROOT_DIR, "public", "icons", "items");
  ensureDir(publicIconsDir);
  if (fs.existsSync(neiIconsDir)) {
    console.log(`  Copying icons from ${neiIconsDir} to ${publicIconsDir}`);
    // Prefer built-in cpSync when available (Node 16.7+), otherwise do a recursive copy
    if ((fs as any).cpSync) {
      (fs as any).cpSync(neiIconsDir, publicIconsDir, { recursive: true });
    } else {
      const copyRecursive = (src: string, dest: string) => {
        for (const name of fs.readdirSync(src)) {
          const s = path.join(src, name);
          const d = path.join(dest, name);
          const st = fs.statSync(s);
          if (st.isDirectory()) {
            ensureDir(d);
            copyRecursive(s, d);
          } else {
            fs.copyFileSync(s, d);
          }
        }
      };
      copyRecursive(neiIconsDir, publicIconsDir);
    }
  } else {
    console.log(`  NEI icons directory not found: ${neiIconsDir}`);
  }

  console.log("\n=== Processing complete! ===");
  console.log(`Items: ${itemCount}`);
  console.log(`Recipes: ${totalRecipes}`);
  console.log(`Machines: ${machines.length}`);
  console.log(`Fluids: ${fluidsIndex.length}`);
}

main().catch(console.error);
