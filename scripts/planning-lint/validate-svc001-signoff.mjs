#!/usr/bin/env node
/** SVC-001 cycle exit — signoff doc, queue complete, G-29, 64 journeys, stackProfiles. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const required = [
  'docs/engine/SVC-001_SIGNOFF.md',
  'docs/engine/planning/SVC-001-vercel-adjacent-spike.md',
  'docs/engine/specimens/fixtures/e2e/pages-split-outbound.bundle.json',
  'docs/engine/specimens/obligation-wave79-additions.json',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const queue = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/service-expansion-queue.json'), 'utf8'),
);
const svc = queue.services.find((s) => s.id === 'SVC-001');
if (!svc || svc.status !== 'complete') failures.push('SVC-001 queue status must be complete');
if (!svc?.witness?.approved) failures.push('SVC-001 witness not approved');

const matrix = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json'), 'utf8'),
);
if (!matrix.stackProfiles?.['SD-06']) failures.push('per-flow-scope missing stackProfiles.SD-06');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 64) failures.push(`user journeys: ${uj.scenarios?.length} < 64`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g29 = gr.gaps.find((g) => g.id === 'G-29');
if (!g29 || g29.status !== 'closed') failures.push('G-29 must be closed');

const signoff = readFileSync(join(ROOT, 'docs/engine/SVC-001_SIGNOFF.md'), 'utf8');
if (!signoff.includes('COMPLETE')) failures.push('SVC-001_SIGNOFF status not COMPLETE');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ SVC-001 signoff — queue complete, ${uj.scenarios.length} journeys, G-29 closed`);
process.exit(0);
