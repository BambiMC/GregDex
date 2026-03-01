# GregDex

**Fully Static** Item Database and Recipe Viewer for GregTech: New Horizons modpack.

## Setup & Deployment (in order)

### 1. Process Data (run once, or whenever exports change)

Place your zip exports in the project root, then run:

```bash
npm run process-data
```

This reads `betterquesting_*.zip` and `nei_export_*.zip` and outputs JSON to the `data/` directory, including:

- `items-index.json`, `fluids-index.json`, `machines.json`, `materials.json`
- `items/` (47K files), `fluids/` (1381 files), `recipes/` (chunked by machine)
- `fluids-recipe-index.json` (fluid → recipe refs index)
- `bee-species.json`, `bee-mutations.json`, `ore-veins.json`, `small-ores.json`, `blood-magic.json`

### 2. Ensure the public/data symlink exists

The build copies everything under `public/` into `out/`. A symlink makes the data directory available as static files:

```bash
cd public && ln -sf ../data data
```

(Only needed once. Already created if `public/data` exists.)

### 3. Build

```bash
npm install       # install dependencies
rm -rf out
clear
npm run build     # produces the out/ directory
```

### 4. Serve

The output is fully static — no server needed:

```bash
npx serve out
```

## Development

```bash
npm run dev       # start dev server on http://localhost:3000
```

## Features

- Browse 47,000+ items across multiple categories
- View 246,000+ crafting recipes and machine processes
- Explore 152+ machines and their functions
- Navigate materials, fluids/gases, bees, ores, and blood magic content
- Ctrl+K global search (client-side, no server required)
- Responsive design with mobile-friendly navigation

## How It Works

**Built entirely statically** (`output: "export"` in `next.config.ts`) — **no server-side API routes, no server-side data fetching at runtime**. All data is pre-processed into JSON at build time and served as static client-side resources.

- **No APIs**: Pages load data on the client by fetching `/data/*.json` static files directly
- **Client-side only**: All data access (search, recipes, item metadata) happens in the browser
- **Static build only**: `npm run process-data` runs before `npm run build` (development server runs separately but `npm start` doesn't apply)
- **Deploy static**: `out/` directory contains everything needed; deploy `out/data/` to any static host

## Tech Stack

Built with Next.js, React, TypeScript, and TailwindCSS.
