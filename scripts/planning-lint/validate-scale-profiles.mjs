#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BUNDLE = join(ROOT, 'docs/engine/specimens/scale-profiles.specimen.json');
const SLICER_DIR = join(ROOT, 'docs/engine/specimens/fixtures/slicer');

const bundle = JSON.parse(readFileSync(BUNDLE, 'utf8'));
const tools = new Set(bundle.profiles.map((p) => p.tool));
const required = ['T01', 'T02', 'T03', 'T04', 'T05', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14'];
const failures = [];

for (const t of required) {
  if (!tools.has(t)) failures.push(`missing scale profile for ${t}`);
}

for (const file of readdirSync(SLICER_DIR).filter((f) => f.endsWith('.fixture-spec.json'))) {
  const spec = JSON.parse(readFileSync(join(SLICER_DIR, file), 'utf8'));
  if (!spec.input.scaleProfile) failures.push(`${spec.fixtureId}: no scaleProfile`);
}

if (failures.length) {
  failures.forEach((f) => console.error(`✗ ${f}`));
  process.exit(1);
}
console.log(`✓ Scale profiles — ${bundle.profiles.length} tools, ${readdirSync(SLICER_DIR).length} slicer fixtures`);
process.exit(0);
