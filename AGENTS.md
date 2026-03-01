# AGENTS.md

This file provides guidance to Claude Code agents when working with code in this repository.

## Project Overview

GregDex is a comprehensive item and recipe database for the GregTech: New Horizons modpack. It displays 47,000+ items, 246,000+ recipes across 152+ machines, plus materials, fluids, bees, ores, and blood magic content. Built with Next.js, React, TypeScript, and TailwindCSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Language**: TypeScript 5
- **Data Format**: JSON
- **Build Tools**: tsx for scripts, PostCSS

## Common Commands

Run these in order when setting up or updating data:

```bash
# Step 1: Process data from zip exports (run once, or whenever exports change)
npm run process-data     # Reads betterquesting_*.zip and nei_export_*.zip
                         # Outputs to data/ directory (items, fluids, recipes, indices)

# Step 2: Ensure public/data symlink exists (one-time setup)
# cd public && ln -sf ../data data

# Step 3: Development or build
npm run dev              # Start development server on http://localhost:3000
npm run build            # Build static output to out/ directory

# Step 4: Serve static output (no server needed)
# npx serve out          # or nginx, Caddy, Vercel, etc.
```

It is not needed to run `npm run dev`, because multiple agents can work on the same codebase simultaneously so there is an instance of the dev server running on http://localhost:3000 at all times.

**Important**: `npm start` does not apply — the app is fully static (`output: "export"` in `next.config.ts`). There is no Node.js server at runtime; deploy the `out/` directory to any static host.

## Architecture & Data Structure

### Data Organization

Data is stored as JSON files in the `data/` directory:

- **items/**: Individual item files (one file per item, named with base64url-encoded item ID)
- **fluids/**: Individual fluid files
- **recipes/**: Organized by machine ID, then chunked (e.g., `recipes/{machineId}/chunk-{n}.json`)
- **items-index.json**: Index of all items with ID, displayName, modId (used by client-side search)
- **fluids-index.json**: Index of all fluids with name and displayName
- **fluids-recipe-index.json**: Maps fluid ID → recipe refs (recipesAsOutput, recipesAsInput) — built by process-data
- **machines.json**: List of all machines and their metadata
- **materials.json**: Material properties and stats
- **bee-species.json** / **bee-mutations.json**: Bee breeding data
- **ore-veins.json** / **small-ores.json**: Ore generation info
- **blood-magic.json**: Blood magic recipes

### Static Export Architecture

The app uses `output: "export"` in `next.config.ts` — there are **no server-side API routes at runtime**. All data is served as static JSON files:

- A `public/data → ../data` symlink causes `npm run build` to copy the entire `data/` directory into `out/data/`
- All pages fetch data client-side from `/data/*.json` URLs
- Dynamic route shells are pre-rendered with `generateStaticParams()` returning a placeholder; actual data is loaded client-side
- Item icons are in `public/icons/items/` (47K PNGs, served statically from `out/icons/items/`)

### Multi-Version Support

- Configured in `src/types/versions.ts` (GTNH_VERSIONS array)
- Currently supports GTNH 2.7.4 as default
- Data path is version-specific via `dataPath` property
- VersionContext provides version selection throughout the app

### Core Type System

Key interfaces in `src/types/index.ts`:
- **ProcessedItem**: Items with recipe references (recipesAsOutput, recipesAsInput)
- **Recipe**: Machine recipes with inputs/outputs (items and fluids)
- **MachineInfo**: Machine metadata and recipe counts
- **BeeSpecies** / **BeeMutation**: Bee genetics
- **OreVein** / **SmallOre**: Ore distribution
- **Material**: Material properties (density, melting point, etc.)

### Data Access Layer

`src/lib/data.ts` provides:
- Item/fluid/machine/material lookups
- Recipe chunk loading
- Built-in caching (Map-based, per-process)
- Item ID encoding/decoding (base64url for internal use, readable format with hyphens for URLs)

Helper functions:
- `getItem(encodedId, version?)`: Get single item
- `getItemsIndex(version?)`: Get all items
- `getRecipeChunk(machineId, chunk, version?)`: Get recipe batch for a machine
- Similar getters for fluids, materials, bees, ores, blood magic

## Code Structure

```
src/
├── app/                          # Next.js App Router
│   ├── items/                    # Item pages (dynamic [itemId])
│   ├── recipes/                  # Recipe display components
│   ├── machines/                 # Machine listing and detail
│   ├── materials/                # Materials database
│   ├── bees/                     # Bee species and mutations
│   ├── ores/                     # Ore vein information
│   ├── fluids-gases/             # Fluid lookup
│   ├── blood-magic/              # Blood magic recipes
│   ├── layout.tsx                # Root layout with VersionProvider
│   └── globals.css               # Global Tailwind styles
├── components/                   # Reusable React components
│   ├── layout/                   # AppShell, navigation
│   ├── items/                    # Item display components
│   ├── recipes/                  # Recipe visualization
│   ├── search/                   # Search interface
│   ├── ui/                       # Basic UI elements
│   └── ItemIcon.tsx              # Item icon display
├── contexts/                     # React Context
│   └── VersionContext.tsx        # Version selection state
├── hooks/                        # Custom React hooks
├── lib/
│   ├── data.ts                   # Core data loading and caching
│   ├── utils.ts                  # Utility functions
│   ├── format.ts                 # Formatting helpers (numbers, units)
│   └── constants.ts              # App constants
└── types/
    ├── index.ts                  # Core type definitions
    └── versions.ts               # Version configuration

scripts/
└── process-data.ts              # Data processing script for zip files
```

## Key Development Patterns

### Item ID Handling

- **Internal storage**: base64url encoding (compact)
- **URL paths**: readable format with hyphens (e.g., `gregtech-gt.metaitem.01-32741`)
- Conversion functions: `encodeItemId()`, `decodeItemId()`, `parseReadableItemId()`
- Use `isReadableItemId()` to detect format

### Recipe Access

Recipes are chunked by machine to manage large datasets (~500 recipes per chunk):
1. Items store recipe refs: `{ machine, chunk, index }` in `recipesAsOutput` / `recipesAsInput`
2. Fluids look up refs via `fluids-recipe-index.json`
3. Client fetches only the chunks it needs: `fetch(\`/data/recipes/${machineId}/chunk-${n}.json\`)`
4. Recipe at position `index` within the chunk array is extracted

### Search

Global search (Ctrl+K) is fully client-side:
- Loads `items-index.json` (4.6MB, 47K items) once per browser session via module-level cache
- Filters with substring match on `displayName`, `modId`, `id` — O(47K) scan, ~1ms in JS
- Returns up to 15 results; no server round-trip required

## Deployment & Data Files

- **Data files**: Git-ignored, stored in `data/` directory (from zips or processed locally)
- **public/data**: Symlink to `../data` — causes build to copy data into `out/data/`
- **out/**: Static build output — deploy this directory to any static host
- **public/icons/items**: Item icon images (git-ignored, generated from zip exports)

## Important Notes

- The app is **fully static** — no Node.js server needed at runtime
- Deploy `out/` to any static file server (Vercel, Netlify, nginx, GitHub Pages, etc.)
- `npm run process-data` must be run whenever data exports change, before `npm run build`
- `public/data → ../data` symlink must exist before running `npm run build`
- Data is read-only at runtime; all processing happens at build/data-processing time
- Use VersionContext when accessing version-aware data in components
