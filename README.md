# GregDex

A comprehensive item database and recipe viewer for GregTech modpack.

## Data Processing

Run `npm run process-data` to process exported zip files (BetterQuesting, NEI) into JSON data:

```bash
# Process data from zip exports
npm run process-data
```

This command:
- Reads from `betterquesting_*.zip` and `nei_export_*.zip` files
- Processes and outputs to the `data/` directory
- Generates indexed JSON files for all items, fluids, recipes, and metadata

## Quick Start

- **Install dependencies**: `npm install`
- **Run development server**: `npm run dev`
- **Build for production**: `npm run build`

## Features

- Browse 47,398+ items across multiple categories
- View 246,961+ crafting recipes and machine processes
- Explore 152+ machines and their functions
- Navigate materials, fluids/gases, bees, ores, and blood magic content
- Responsive design with mobile-friendly navigation

## Development

Built with Next.js, React, TypeScript, and TailwindCSS.
