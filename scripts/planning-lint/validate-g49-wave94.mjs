#!/usr/bin/env node
/** G-49 exit — pattern equivalence registry wave 94 harvest. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

for (const rel of [
  'docs/engine/planning/pattern-equivalence-registry.json',
  'packages/mcp-core/src/pattern-equivalence.js',
  'docs/engine/specimens/fixtures/guardian-equivalence/guardian-style-snippets.json',
]) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const reg = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/pattern-equivalence-registry.json'), 'utf8'),
);
const required = ['STWH-001', 'STWH-002', 'AUTH-RT-001', 'AUTH-MW-001', 'PROV-001'];
for (const pid of required) {
  if (!reg.patterns?.[pid]?.match) failures.push(`registry missing ${pid}`);
}

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g49 = gr.gaps.find((g) => g.id === 'G-49');
if (!g49 || g49.status !== 'closed') failures.push('G-49 must be closed');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if (!uj.scenarios.some((s) => s.id === 'UJ-119')) failures.push('UJ-119 guardian equivalence journey missing');

const guardian = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/simulate-guardian-equivalence.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (guardian.status !== 0) failures.push(`guardian-retest failed\n${guardian.stdout}\n${guardian.stderr}`);

const t05 = spawnSync(process.execPath, [join(ROOT, 'scripts/g2-t05-golden.mjs')], { cwd: ROOT, encoding: 'utf8' });
if (t05.status !== 0) failures.push(`g2:t05 golden failed\n${t05.stdout}\n${t05.stderr}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('✓ G-49 wave 94 pattern equivalence — registry + guardian retest + T05 calibration');
process.exit(0);
