#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const src = path.join(repoRoot, '.htaccess');
const outDir = path.join(repoRoot, 'out');
const dest = path.join(outDir, '.htaccess');

try {
  if (!fs.existsSync(src)) {
    console.log('.htaccess not found in project root; skipping copy.');
    process.exit(0);
  }
  if (!fs.existsSync(outDir)) {
    console.log('out/ directory not found; skipping copy.');
    process.exit(0);
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied .htaccess to ${dest}`);
} catch (err) {
  console.error('Failed to copy .htaccess:', err);
  process.exit(2);
}
