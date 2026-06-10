#!/usr/bin/env node
/** G-44 exit — Stripe prep scaffold before transcript-guided G-40. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

if (!existsSync(join(ROOT, 'docs/engine/STRIPE_SETUP_PREP.md'))) {
  failures.push('missing STRIPE_SETUP_PREP.md');
}

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g44 = gr.gaps.find((g) => g.id === 'G-44');
if (!g44 || g44.status !== 'closed') failures.push('G-44 must be closed');
const g40 = gr.gaps.find((g) => g.id === 'G-40');
if (!g40 || g40.status !== 'planned') failures.push('G-40 must remain planned until transcript + staging');

const biz = readFileSync(join(ROOT, 'docs/engine/BUSINESS_INFRASTRUCTURE_PLAN.md'), 'utf8');
if (!biz.includes('STRIPE_SETUP_PREP')) failures.push('BUSINESS_INFRASTRUCTURE_PLAN should link STRIPE_SETUP_PREP');

const r = spawnSync(process.execPath, [join(ROOT, 'scripts/planning-lint/simulate-stripe-prep.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (r.status !== 0) failures.push(`simulate-stripe-prep failed:\n${(r.stdout ?? '') + (r.stderr ?? '')}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('✓ G-44 wave89 stripe prep — scaffold OK, G-40 still planned');
process.exit(0);
