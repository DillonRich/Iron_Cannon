#!/usr/bin/env node
/** G-48 exit — Guardian dogfood P0 trust fixes wave 93 harvest. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

for (const rel of [
  'docs/engine/GUARDIAN_DOGFOOD_REMEDIATION_PLAN.md',
  'docs/engine/sessions/SESSION-20260608-guardian-infrastructure-dogfood.md',
  'packages/mcp-core/src/t05-verify.js',
]) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
const trust = uj.scenarios.filter((s) => s.id >= 'UJ-117' && s.id <= 'UJ-118');
if (trust.length < 2) failures.push(`G-48 trust journeys: ${trust.length} < 2`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g48 = gr.gaps.find((g) => g.id === 'G-48');
if (!g48 || g48.status !== 'closed') failures.push('G-48 must be closed');
const g49 = gr.gaps.find((g) => g.id === 'G-49');
if (!g49 || g49.status !== 'closed') failures.push('G-49 must be closed (wave 94)');

const tier = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/tier-entitlement-matrix.json'), 'utf8'),
);
if ((tier.rateLimits?.pro?.perMinute ?? 0) < 60) failures.push('pro perMinute should be raised for audit scripts');

const golden = spawnSync(process.execPath, [join(ROOT, 'scripts/g2-golden-full.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (golden.status !== 0) failures.push(`g2:golden-full failed\n${golden.stdout}\n${golden.stderr}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ G-48 wave 93 guardian trust — ${uj.scenarios.length} journeys, golden-full green`);
process.exit(0);
