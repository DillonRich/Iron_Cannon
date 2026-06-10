#!/usr/bin/env node
/** SVC-002 cycle exit — signoff doc, queue complete, G-32, 75 journeys, stackProfiles. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const required = [
  'docs/engine/SVC-002_SIGNOFF.md',
  'docs/engine/planning/SVC-002-supabase-spike.md',
  'docs/engine/specimens/fixtures/e2e/supabase-primary-outbound.bundle.json',
  'docs/engine/specimens/obligation-wave81-additions.json',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const queue = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/service-expansion-queue.json'), 'utf8'),
);
const svc = queue.services.find((s) => s.id === 'SVC-002');
if (!svc || svc.status !== 'complete') failures.push('SVC-002 queue status must be complete');
if (!svc?.witness?.approved) failures.push('SVC-002 witness not approved');

const matrix = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json'), 'utf8'),
);
if (!matrix.stackProfiles?.['SD-07']) failures.push('per-flow-scope missing stackProfiles.SD-07');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 75) failures.push(`user journeys: ${uj.scenarios?.length} < 75`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g32 = gr.gaps.find((g) => g.id === 'G-32');
if (!g32 || g32.status !== 'closed') failures.push('G-32 must be closed');

const signoff = readFileSync(join(ROOT, 'docs/engine/SVC-002_SIGNOFF.md'), 'utf8');
if (!signoff.includes('COMPLETE')) failures.push('SVC-002_SIGNOFF status not COMPLETE');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ SVC-002 signoff — queue complete, ${uj.scenarios.length} journeys, G-32 closed`);
process.exit(0);
