# GregDex

A comprehensive item database and recipe viewer for GregTech: New Horizons modpack.

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
npx serve out     # or any static file server (nginx, Caddy, Vercel, GitHub Pages, etc.)
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

GregDex is a **fully static site** (`output: "export"` in `next.config.ts`). There are no server-side API routes at runtime. All data is pre-processed into JSON and served as static files from `out/data/`.

- Pages load data on the client by fetching `/data/*.json` files
- Search is client-side: `items-index.json` is loaded once and cached in memory per browser session
- Recipes are chunked (~500/chunk per machine); only needed chunks are fetched on demand
- Item icons live in `public/icons/items/` (47K PNG files, served statically)

## Tech Stack

Built with Next.js, React, TypeScript, and TailwindCSS.
