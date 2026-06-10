#!/usr/bin/env node
/** G-46 exit — polish arc session signoff; operator gaps remain planned. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

for (const rel of [
  'docs/engine/POLISH_ARC_SIGNOFF.md',
  'docs/engine/NEXT_MAIN_SESSION.md',
  'docs/engine/PLANNING_SESSION_HANDOFF_20260531.md',
]) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 110) failures.push(`user journeys: ${uj.scenarios?.length} < 110`);

const cap = uj.scenarios.filter((s) => s.id >= 'UJ-106' && s.id <= 'UJ-110');
if (cap.length < 5) failures.push(`arc cap journeys: ${cap.length} < 5`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g46 = gr.gaps.find((g) => g.id === 'G-46');
if (!g46 || g46.status !== 'closed') failures.push('G-46 must be closed');

for (const id of ['G-36', 'G-38', 'G-39', 'G-40', 'G-41']) {
  const g = gr.gaps.find((x) => x.id === id);
  if (!g || g.status !== 'planned') failures.push(`${id} must remain planned`);
}

const pf = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/validate-operator-preflight-bundle.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (pf.status !== 0) failures.push('planning:preflight bundle failed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ G-46 polish arc signoff — ${uj.scenarios.length} journeys, preflight green, operator gaps planned`);
process.exit(0);
