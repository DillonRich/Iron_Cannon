#!/usr/bin/env node
/** Chunk 10b — optional flow modules M20–M56 T04/T05 readiness */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SPECIMENS = join(ROOT, 'docs/engine/specimens');
const FIXTURES = join(ROOT, 'docs/engine/specimens/fixtures/modules');

const OPTIONAL = [
  'M20-reset-token-schema', 'M21-reset-api', 'M22-reset-ui', 'M23-reset-email',
  'M30-onboarding-schema', 'M31-onboarding-api', 'M32-onboarding-ui',
  'M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui',
  'M50-export-api', 'M51-export-worker', 'M52-export-ui',
  'M55-terms-reaccept-api', 'M56-terms-reaccept-ui',
];

const failures = [];
for (const moduleId of OPTIONAL) {
  const specPath = join(SPECIMENS, `${moduleId.replace(/^M/, 'm')}.specimen.json`);
  const exists = existsSync(specPath);
  if (!exists) {
    failures.push(`${moduleId}: no specimen`);
    continue;
  }
  const fixPath = join(FIXTURES, `${moduleId}.fixture-spec.json`);
  if (!existsSync(fixPath)) failures.push(`${moduleId}: no fixture`);
  else {
    const f = JSON.parse(readFileSync(fixPath, 'utf8'));
    if (!f.passSnippet) failures.push(`${moduleId}: no passSnippet`);
  }
}

if (failures.length) {
  console.error('Chunk 10b optional failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Chunk 10b optional modules — ${OPTIONAL.length}/15 ready for T04/T05`);
process.exit(0);
