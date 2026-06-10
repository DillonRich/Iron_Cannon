#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'),
);

const OPTIONAL = [
  'M20-reset-token-schema',
  'M21-reset-api',
  'M22-reset-ui',
  'M23-reset-email',
  'M30-onboarding-schema',
  'M31-onboarding-api',
  'M32-onboarding-ui',
  'M40-deletion-api',
  'M41-deletion-scheduler',
  'M42-deletion-ui',
  'M50-export-api',
  'M51-export-worker',
  'M52-export-ui',
  'M55-terms-reaccept-api',
  'M56-terms-reaccept-ui',
];

const failures = [];
for (const id of OPTIONAL) {
  if (!manifest.modules?.[id]) failures.push(`missing optional module: ${id}`);
}

if (failures.length) {
  console.error('Optional rules manifest failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ rules-manifest optional — ${OPTIONAL.length}/${OPTIONAL.length} modules indexed`);
process.exit(0);
