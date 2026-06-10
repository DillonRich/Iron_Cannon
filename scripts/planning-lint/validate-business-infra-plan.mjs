#!/usr/bin/env node
/** Business + pre-launch SSOT — stakeholder plan documented, gaps G-38..G-41 planned. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const requiredDocs = [
  'docs/engine/BUSINESS_INFRASTRUCTURE_PLAN.md',
  'docs/engine/PRE_LAUNCH_DOGFOOD_PLAN.md',
];

for (const rel of requiredDocs) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const biz = readFileSync(join(ROOT, 'docs/engine/BUSINESS_INFRASTRUCTURE_PLAN.md'), 'utf8');
for (const needle of ['Google Workspace', 'Stripe', 'affiliate', 'transcript', 'cheap']) {
  if (!biz.toLowerCase().includes(needle.toLowerCase())) failures.push(`BUSINESS_INFRASTRUCTURE_PLAN missing: ${needle}`);
}

const dog = readFileSync(join(ROOT, 'docs/engine/PRE_LAUNCH_DOGFOOD_PLAN.md'), 'utf8');
for (const needle of ['projectPath', 'T01', 'T05', 'G-39']) {
  if (!dog.includes(needle)) failures.push(`PRE_LAUNCH_DOGFOOD_PLAN missing: ${needle}`);
}

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
for (const id of ['G-38', 'G-39', 'G-40', 'G-41']) {
  const g = gr.gaps.find((x) => x.id === id);
  if (!g || g.status !== 'planned') failures.push(`${id} must be planned`);
}

const next = readFileSync(join(ROOT, 'docs/engine/PLANNING_NEXT_ACTIONS.md'), 'utf8');
if (!next.includes('BUSINESS_INFRASTRUCTURE_PLAN')) failures.push('PLANNING_NEXT_ACTIONS must link business plan');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('✓ Business infra plan — docs OK, G-38..G-41 planned, dogfood SSOT ready');
process.exit(0);
