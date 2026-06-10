#!/usr/bin/env node
/** G-34 exit — documented sessions harvested into behavioral user journeys. */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const sessionsDir = join(ROOT, 'docs/engine/sessions');
const sessionFiles = readdirSync(sessionsDir).filter(
  (f) => f.startsWith('SESSION-') && f.endsWith('.md'),
);
if (sessionFiles.length < 2) failures.push(`session docs: ${sessionFiles.length} < 2`);

const readme = readFileSync(join(sessionsDir, 'README.md'), 'utf8');
if (!readme.includes('## Index')) failures.push('sessions README missing Index');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 80) failures.push(`user journeys: ${uj.scenarios?.length} < 80`);

const harvested = uj.scenarios.filter((s) => s.id >= 'UJ-076' && s.id <= 'UJ-080');
if (harvested.length < 5) failures.push(`session-harvest journeys: ${harvested.length} < 5`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g34 = gr.gaps.find((g) => g.id === 'G-34');
if (!g34 || g34.status !== 'closed') failures.push('G-34 must be closed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ G-34 session harvest — ${sessionFiles.length} sessions, ${uj.scenarios.length} journeys, ${harvested.length} UJ-076–080`,
);
process.exit(0);
