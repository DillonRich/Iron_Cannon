#!/usr/bin/env node
/**
 * Chunk 22 — every golden + optional catalog module has manifest + specimen on disk.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'),
);

const REQUIRED = [
  ...Object.keys(MANIFEST.modules),
];

const errors = [];
for (const moduleId of REQUIRED) {
  const entry = MANIFEST.modules[moduleId];
  if (!entry.fragmentIds?.length) errors.push(`${moduleId}: no fragmentIds`);
  if (!entry.specimenPath) errors.push(`${moduleId}: no specimenPath`);
  else {
    const p = join(ROOT, 'docs/engine', entry.specimenPath);
    if (!existsSync(p)) errors.push(`${moduleId}: specimen missing ${entry.specimenPath}`);
  }
  const fix = join(ROOT, 'docs/engine/specimens/fixtures/modules', `${moduleId}.fixture-spec.json`);
  if (!existsSync(fix)) errors.push(`${moduleId}: verify fixture missing`);
}

const flows = Object.keys(MANIFEST.flows ?? {});
if (flows.length < 3) errors.push(`flows: expected >=3 got ${flows.length}`);

if (errors.length) {
  console.error('Rules package coverage failures:\n' + errors.join('\n'));
  process.exit(1);
}

console.log(`✓ Rules package coverage — ${REQUIRED.length} modules, ${flows.length} flows`);
process.exit(0);
