#!/usr/bin/env node
/** SVC-001 Phase A exit — SD-06, M60/M61 fixtures, EM-4 pages rows, spike doc complete. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const requiredFiles = [
  'docs/engine/planning/SVC-001-vercel-adjacent-spike.md',
  'docs/engine/specimens/fixtures/stack-detection/pages-worker-split-supported.fixture-spec.json',
  'docs/engine/specimens/fixtures/modules/M60-pages-wrangler-config.fixture-spec.json',
  'docs/engine/specimens/fixtures/modules/M61-pages-env-bridge.fixture-spec.json',
];

for (const rel of requiredFiles) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const em4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
);
for (const id of ['CH-PAGES-001', 'CH-PAGES-002']) {
  if (!em4.conflicts.some((c) => c.conflictId === id)) failures.push(`EM-4 missing ${id}`);
}
if (em4.conflicts.filter((c) => c.detectFixture === 'SD-06').length < 1) {
  failures.push('EM-4: need SD-06 detectFixture link');
}

const sd06 = JSON.parse(
  readFileSync(
    join(ROOT, 'docs/engine/specimens/fixtures/stack-detection/pages-worker-split-supported.fixture-spec.json'),
    'utf8',
  ),
);
if (sd06.fixtureId !== 'SD-06') failures.push('SD-06 fixtureId mismatch');
if (sd06.expectedT01?.supported !== true) failures.push('SD-06 expected supported');
if (sd06.expectedT02?.complete !== true) failures.push('SD-06 expected T02 complete');

const spike = readFileSync(join(ROOT, 'docs/engine/planning/SVC-001-vercel-adjacent-spike.md'), 'utf8');
if (!spike.includes('SD-06')) failures.push('spike doc missing SD-06');
if (spike.includes('Status:** Phase A (planning only')) failures.push('spike doc still Phase A draft status');

const scope = readFileSync(join(ROOT, 'docs/engine/PLANNING_SCOPE_BOUNDARIES.md'), 'utf8');
if (!scope.includes('SD-01..06') && !scope.includes('SD-01..08')) {
  failures.push('scope boundaries missing SD-01..06 (or SD-01..08)');
}

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g27 = gr.gaps.find((g) => g.id === 'G-27');
if (!g27 || g27.status !== 'closed') failures.push('G-27 must be closed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('✓ SVC-001 spike — SD-06, M60/M61, EM-4 CH-PAGES-*, G-27 closed');
process.exit(0);
