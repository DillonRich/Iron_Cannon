#!/usr/bin/env node
/** Service expansion cycle exit — SVC-001 + SVC-002 complete, G-33, stack profiles. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const required = [
  'docs/engine/SERVICE_EXPANSION_CYCLE_SIGNOFF.md',
  'docs/engine/SVC-001_SIGNOFF.md',
  'docs/engine/SVC-002_SIGNOFF.md',
  'docs/engine/specimens/fixtures/e2e/pages-split-outbound.bundle.json',
  'docs/engine/specimens/fixtures/e2e/supabase-primary-outbound.bundle.json',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const queue = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/service-expansion-queue.json'), 'utf8'),
);
for (const id of ['SVC-001', 'SVC-002']) {
  const svc = queue.services.find((s) => s.id === id);
  if (!svc || svc.status !== 'complete') failures.push(`${id} must be complete`);
  if (!svc?.witness?.approved) failures.push(`${id} witness not approved`);
}

const matrix = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json'), 'utf8'),
);
for (const sid of ['SD-06', 'SD-07']) {
  if (!matrix.stackProfiles?.[sid]) failures.push(`per-flow-scope missing stackProfiles.${sid}`);
}

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 75) failures.push(`user journeys: ${uj.scenarios?.length} < 75`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g33 = gr.gaps.find((g) => g.id === 'G-33');
if (!g33 || g33.status !== 'closed') failures.push('G-33 must be closed');

const cycle = readFileSync(join(ROOT, 'docs/engine/SERVICE_EXPANSION_CYCLE_SIGNOFF.md'), 'utf8');
if (!cycle.includes('COMPLETE')) failures.push('SERVICE_EXPANSION_CYCLE_SIGNOFF status not COMPLETE');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Service expansion cycle — SVC-001/002 complete, ${uj.scenarios.length} journeys, G-33 closed`);
process.exit(0);
