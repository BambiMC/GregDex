# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GregDex is a comprehensive item and recipe database for the GregTech: New Horizons modpack. It displays 47,000+ items, 246,000+ recipes across 152+ machines, plus materials, fluids, bees, ores, and blood magic content. Built with Next.js, React, TypeScript, and TailwindCSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Language**: TypeScript 5
- **Data Format**: JSON
- **Build Tools**: tsx for scripts, PostCSS

## Common Commands

```bash
# Data Processing (First Step)
npm run process-data     # Process exported zip files (BetterQuesting, NEI) into JSON data
                         # Reads from betterquesting_*.zip and nei_export_*.zip files
                         # Outputs to data/ directory

# Development
npm run dev              # Start development server on http://localhost:3000

# Production
npm run build            # Build for production
npm start                # Run production server
```

It is not needed for run npm run dev, because multiple agents can work on the same codebase simultaneously so there is an instance of the dev server running on http://localhost:3000 at all times.

## Architecture & Data Structure

### Data Organization

Data is stored as JSON files in the `data/` directory:

- **items/**: Individual item files (one file per item, named with base64url-encoded item ID)
- **fluids/**: Individual fluid files
- **recipes/**: Organized by machine ID, then chunked (e.g., `recipes/{machineId}/chunk-{n}.json`)
- **items-index.json**: Index of all items with ID, displayName, modId
- **fluids-index.json**: Index of all fluids
- **machines.json**: List of all machines and their metadata
- **materials.json**: Material properties and stats
- **bee-species.json** / **bee-mutations.json**: Bee breeding data
- **ore-veins.json** / **small-ores.json**: Ore generation info
- **blood-magic.json**: Blood magic recipes
- **search/**: Trigram indices for search optimization

### Multi-Version Support

- Configured in `src/types/versions.ts` (GTNH_VERSIONS array)
- Currently supports GTNH 2.7.4 as default
- Data path is version-specific via `dataPath` property
- API routes accept optional `?version=` query parameter
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
│   ├── api/                      # API routes (RESTful endpoints)
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

## API Pattern

All API routes follow the same pattern:
- Accept optional `?version=` parameter for multi-version support
- Return paginated responses for lists (PaginatedResponse type)
- Include Cache-Control headers for performance
- Return 404 or null if resource not found

Example: `/api/items?page=1&limit=60&mod=gregtech&version=2.7.4`

## Key Development Patterns

### Item ID Handling

- **Internal storage**: base64url encoding (compact)
- **URL paths**: readable format with hyphens (e.g., `gregtech-gt.metaitem.01-32741`)
- Conversion functions: `encodeItemId()`, `decodeItemId()`, `parseReadableItemId()`
- Use `isReadableItemId()` to detect format

### Recipe Access

Recipes are chunked by machine to manage large datasets:
1. Get machine info from `getMachines()`
2. Load individual chunks as needed: `getRecipeChunk(machineId, chunkNum, version)`
3. Each chunk contains Recipe[] objects

### Search

Uses trigram indexing for fast partial matching:
- Index stored in `search/items-trigrams.json`
- Trigram-to-index lookups enable fast search
- Used by `/api/search` route

## Deployment & Data Files

- **Data files**: Git-ignored, stored in `data/` directory (from zips or processed locally)
- **.next**: Build output (ignored)
- **public/icons/items**: Item icon images (git-ignored, generated from zip exports)
- **Next.js rewrites**: `/icons/items/*` routes through `/api/icons/items/*` API handler

## Important Notes

- Data is read-only at runtime (loaded from JSON files)
- No database dependency - all data is pre-processed to JSON
- The `npm run process-data` script must be run whenever data exports change
- Caching is in-process; restart server to clear cache
- Use VersionContext when accessing version-aware data in components
