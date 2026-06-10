#!/usr/bin/env node
/** G-47 exit — dogfood live harness wave 92 harvest. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

for (const rel of [
  'docs/engine/DOGFOOD_CURSOR_WALKTHROUGH.md',
  'docs/engine/sessions/SESSION-20260531-iron-cannon-dogfood.md',
  'scripts/planning-lint/simulate-dogfood-live.mjs',
  'scripts/planning-lint/validate-operator-dogfood-bundle.mjs',
]) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
const live = uj.scenarios.filter((s) => s.id >= 'UJ-111' && s.id <= 'UJ-115');
if (live.length < 5) failures.push(`dogfood live journeys: ${live.length} < 5`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g47 = gr.gaps.find((g) => g.id === 'G-47');
if (!g47 || g47.status !== 'closed') failures.push('G-47 must be closed');

const g39 = gr.gaps.find((g) => g.id === 'G-39');
if (!g39 || g39.status !== 'planned') failures.push('G-39 witness must remain planned');

const dogfood = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/validate-operator-dogfood-bundle.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (dogfood.status !== 0) failures.push('operator:dogfood bundle failed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ G-47 wave 92 dogfood harvest — ${uj.scenarios.length} journeys, G-39 witness still planned`);
process.exit(0);
