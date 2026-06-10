#!/usr/bin/env node
/** Affiliates prep — billing module chain ready; G-41 blocked on G-40. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

if (!existsSync(join(ROOT, 'docs/engine/AFFILIATES_SETUP_PREP.md'))) {
  failures.push('missing AFFILIATES_SETUP_PREP.md');
}

const biz = readFileSync(join(ROOT, 'docs/engine/BUSINESS_INFRASTRUCTURE_PLAN.md'), 'utf8');
if (!biz.includes('G-41')) failures.push('BUSINESS_INFRASTRUCTURE_PLAN missing G-41');
if (!biz.includes('AFFILIATES_SETUP_PREP')) failures.push('BUSINESS_INFRASTRUCTURE_PLAN missing AFFILIATES_SETUP_PREP link');

const prep = readFileSync(join(ROOT, 'docs/engine/AFFILIATES_SETUP_PREP.md'), 'utf8');
if (!prep.includes('G-40')) failures.push('AFFILIATES_SETUP_PREP must sequence after G-40');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
const journeys = uj.scenarios.filter((s) => s.id >= 'UJ-101' && s.id <= 'UJ-105');
if (journeys.length < 5) failures.push(`affiliates prep journeys: ${journeys.length} < 5`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g40 = gr.gaps.find((g) => g.id === 'G-40');
const g41 = gr.gaps.find((g) => g.id === 'G-41');
if (!g40 || g40.status !== 'planned') failures.push('G-40 must stay planned');
if (!g41 || g41.status !== 'planned') failures.push('G-41 must stay planned');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Affiliates prep — sequencing OK, ${journeys.length} UJ-101–105`);
process.exit(0);
