#!/usr/bin/env node
/** G-42 exit — business infra session harvested into regression journeys. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const session = join(ROOT, 'docs/engine/sessions/SESSION-20260531-business-infra-stakeholder-notes.md');
if (!existsSync(session)) failures.push('missing business infra session doc');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 90) failures.push(`user journeys: ${uj.scenarios?.length} < 90`);

const harvested = uj.scenarios.filter((s) => s.id >= 'UJ-086' && s.id <= 'UJ-090');
if (harvested.length < 5) failures.push(`G-42 harvest journeys: ${harvested.length} < 5`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g42 = gr.gaps.find((g) => g.id === 'G-42');
if (!g42 || g42.status !== 'closed') failures.push('G-42 must be closed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ G-42 wave87 harvest — ${uj.scenarios.length} journeys, ${harvested.length} UJ-086–090`,
);
process.exit(0);
