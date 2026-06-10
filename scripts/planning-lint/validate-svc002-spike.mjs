#!/usr/bin/env node
/** SVC-002 Phase A exit — SD-07/08, M70/M71 fixtures, EM-4 supabase rows, spike doc complete. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { composeWiremaps } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const requiredFiles = [
  'docs/engine/planning/SVC-002-supabase-spike.md',
  'docs/engine/specimens/fixtures/stack-detection/supabase-primary-supported.fixture-spec.json',
  'docs/engine/specimens/fixtures/stack-detection/supabase-d1-dual-database-conflict.fixture-spec.json',
  'docs/engine/specimens/fixtures/modules/M70-supabase-auth-config.fixture-spec.json',
  'docs/engine/specimens/fixtures/modules/M71-supabase-middleware-ssr.fixture-spec.json',
  'docs/engine/specimens/fixtures/wiremap/w07-supabase-primary.fixture-spec.json',
];

for (const rel of requiredFiles) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const em4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
);
for (const id of ['CH-SUPA-001', 'CH-SUPA-002']) {
  if (!em4.conflicts.some((c) => c.conflictId === id)) failures.push(`EM-4 missing ${id}`);
}
const ch005 = em4.conflicts.find((c) => c.conflictId === 'CH-005');
if (!ch005 || ch005.detectFixture !== 'SD-08') failures.push('CH-005 must link detectFixture SD-08');

const sd07 = JSON.parse(
  readFileSync(
    join(ROOT, 'docs/engine/specimens/fixtures/stack-detection/supabase-primary-supported.fixture-spec.json'),
    'utf8',
  ),
);
if (sd07.fixtureId !== 'SD-07') failures.push('SD-07 fixtureId mismatch');
if (sd07.expectedT01?.supported !== true) failures.push('SD-07 expected supported');
if (sd07.expectedT02?.complete !== true) failures.push('SD-07 expected T02 complete');

const sd08 = JSON.parse(
  readFileSync(
    join(ROOT, 'docs/engine/specimens/fixtures/stack-detection/supabase-d1-dual-database-conflict.fixture-spec.json'),
    'utf8',
  ),
);
if (sd08.fixtureId !== 'SD-08') failures.push('SD-08 fixtureId mismatch');
if (sd08.expectedT01?.supported !== false) failures.push('SD-08 expected unsupported');
if (sd08.expectedT02?.errorCode !== 'STACK_UNSUPPORTED') failures.push('SD-08 expected STACK_UNSUPPORTED');

const wm = composeWiremaps({ stackId: 'SD-07' });
const ids = wm.wiremaps?.[0]?.moduleIds ?? [];
if (ids.length !== 8) failures.push(`SD-07 wiremap: want 8 modules, got ${ids.length}`);
if (ids[0] !== 'M70-supabase-auth-config') failures.push('SD-07 wiremap must start with M70');
if (ids[1] !== 'M71-supabase-middleware-ssr') failures.push('SD-07 wiremap must include M71 second');

const spike = readFileSync(join(ROOT, 'docs/engine/planning/SVC-002-supabase-spike.md'), 'utf8');
if (!spike.includes('SD-07')) failures.push('spike doc missing SD-07');
if (spike.includes('Status:** Phase A (planning only')) failures.push('spike doc still Phase A draft status');

const scope = readFileSync(join(ROOT, 'docs/engine/PLANNING_SCOPE_BOUNDARIES.md'), 'utf8');
if (!scope.includes('SD-01..08')) failures.push('scope boundaries missing SD-01..08');
if (!scope.includes('M70–M71')) failures.push('scope boundaries missing M70–M71');

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g30 = gr.gaps.find((g) => g.id === 'G-30');
if (!g30 || g30.status !== 'closed') failures.push('G-30 must be closed');

const manifest = JSON.parse(readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'));
for (const mid of ['M70-supabase-auth-config', 'M71-supabase-middleware-ssr']) {
  if (!manifest.modules?.[mid]) failures.push(`rules-manifest missing ${mid}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('✓ SVC-002 spike — SD-07/08, M70/M71, W07, EM-4 CH-SUPA-*, G-30 closed');
process.exit(0);
