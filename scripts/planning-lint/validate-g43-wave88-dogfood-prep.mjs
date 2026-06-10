#!/usr/bin/env node
/** G-43 exit — dogfood prep scaffold before live G-39 session. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

for (const rel of [
  'docs/engine/PRE_LAUNCH_DOGFOOD_SIGNOFF.md',
  'scripts/planning-lint/lib/iron-cannon-repo.mjs',
  'scripts/planning-lint/simulate-dogfood-prep.mjs',
]) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g43 = gr.gaps.find((g) => g.id === 'G-43');
if (!g43 || g43.status !== 'closed') failures.push('G-43 must be closed');
const g39 = gr.gaps.find((g) => g.id === 'G-39');
if (!g39 || g39.status !== 'planned') failures.push('G-39 must remain planned until live session');

const r = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/simulate-dogfood-prep.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (r.status !== 0) failures.push(`simulate-dogfood-prep failed:\n${(r.stdout ?? '') + (r.stderr ?? '')}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('✓ G-43 wave88 dogfood prep — scaffold OK, G-39 still planned');
process.exit(0);
