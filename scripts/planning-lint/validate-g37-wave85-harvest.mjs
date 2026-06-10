#!/usr/bin/env node
/** G-37 exit — G-35 operator pack harvested into post-readiness regression journeys. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const session = join(ROOT, 'docs/engine/sessions/SESSION-20260531-operator-deploy-readiness.md');
if (!existsSync(session)) failures.push('missing operator deploy session doc');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 85) failures.push(`user journeys: ${uj.scenarios?.length} < 85`);

const harvested = uj.scenarios.filter((s) => s.id >= 'UJ-081' && s.id <= 'UJ-085');
if (harvested.length < 5) failures.push(`G-37 harvest journeys: ${harvested.length} < 5`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g37 = gr.gaps.find((g) => g.id === 'G-37');
if (!g37 || g37.status !== 'closed') failures.push('G-37 must be closed');

const g35 = gr.gaps.find((g) => g.id === 'G-35');
if (!g35 || g35.status !== 'closed') failures.push('G-35 must remain closed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ G-37 wave85 harvest — ${uj.scenarios.length} journeys, ${harvested.length} UJ-081–085`,
);
process.exit(0);
