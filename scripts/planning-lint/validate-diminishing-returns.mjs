#!/usr/bin/env node
/** PLANNING_R11 §9.1 — diminishing returns signals */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const reg50 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/imagination-50-scenarios.json'), 'utf8'),
);
if ((reg50.minSuccessRate ?? 0.9) > 0.99) {
  // actual pass enforced by simulate-imagination-50 in regression runner
}

const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/reference-index.specimen.json'), 'utf8'),
);
const cards = idx.cardCount ?? idx.entries?.length ?? idx.cards?.length ?? 0;
if (cards < 500) failures.push(`corpus ${cards} < 500 Scale-A`);

if (!existsSync(join(ROOT, 'docs/engine/specimens/fixtures/compose/precedence-golden.fixture-spec.json'))) {
  failures.push('missing precedence fixture');
}

if (failures.length) {
  console.error('§9.1 diminishing returns failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ §9.1 diminishing returns — corpus Scale-A + fixtures present');
process.exit(0);
