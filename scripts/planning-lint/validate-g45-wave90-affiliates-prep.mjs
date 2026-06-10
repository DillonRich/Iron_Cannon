#!/usr/bin/env node
/** G-45 exit — affiliates prep scaffold; G-41 remains planned until G-40. */
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

if (!existsSync(join(ROOT, 'docs/engine/AFFILIATES_SETUP_PREP.md'))) {
  failures.push('missing AFFILIATES_SETUP_PREP.md');
}

const r = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/simulate-affiliates-prep.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (r.status !== 0) failures.push(`simulate-affiliates-prep failed:\n${(r.stdout ?? '') + (r.stderr ?? '')}`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const gap = gr.gaps.find((g) => g.id === 'G-45');
if (!gap || gap.status !== 'closed') failures.push('G-45 must be closed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('✓ G-45 wave90 affiliates prep — scaffold OK, G-41 still planned');
process.exit(0);
