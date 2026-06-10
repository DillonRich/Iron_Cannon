#!/usr/bin/env node
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = join(ROOT, 'packages/mcp-core/src/generated/engine-bundle.json');

if (!existsSync(BUNDLE)) {
  console.error('Missing engine-bundle.json — run npm run build:worker-bundle');
  process.exit(1);
}

const { getEngineDataMode, readEngineJson } = await import('../packages/mcp-core/src/engine-data.js');
const mode = getEngineDataMode();
const matrix = readEngineJson('planning/tier-entitlement-matrix.json');
if (!matrix.tools?.length) {
  console.error('tier matrix empty in bundle');
  process.exit(1);
}
console.log(`✓ G-2 bundle mode — ${mode}, ${matrix.tools.length} tools registered`);
process.exit(0);
