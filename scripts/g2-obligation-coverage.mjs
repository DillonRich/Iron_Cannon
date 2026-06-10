#!/usr/bin/env node
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readEngineJson } from '../packages/mcp-core/src/engine-data.js';
import { loadObligationSpecimen } from '../packages/mcp-core/src/obligation-compare.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(ROOT, 'docs/engine/specimens/layer4');
const idx = readEngineJson('specimens/obligation-index.specimen.json');
const files = new Set(
  readdirSync(dir)
    .filter((f) => f.startsWith('obligation-') && f.endsWith('.specimen.json'))
    .map((f) => f.replace('obligation-', '').replace('.specimen.json', '')),
);

const missing = [];
const broken = [];
for (const o of idx.obligations) {
  if (!files.has(o.id)) missing.push(o.id);
  else if (!loadObligationSpecimen(o.id)) broken.push(o.id);
}

if (missing.length || broken.length) {
  console.error(`obligation coverage: missing=${missing.length} broken=${broken.length}`);
  console.error([...missing, ...broken].slice(0, 20).join('\n'));
  process.exit(1);
}

console.log(`✓ G-2 obligation coverage — ${idx.obligations.length}/${files.size} index↔layer4 specimens`);
process.exit(0);
