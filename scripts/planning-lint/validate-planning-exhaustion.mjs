#!/usr/bin/env node
/** Meta gate — key planning exhaustion metrics in one pass */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

const artifacts = [
  'docs/engine/PLANNING_MASTER.md',
  'docs/engine/PLANNING_GOLDEN_RUNTIME_SPEC.md',
  'docs/engine/planning/em4-cross-host-matrix.json',
  'docs/engine/planning/imagination-100-scenarios.json',
  'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json',
];

const failures = [];
for (const rel of artifacts) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const em3 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em3-legal-touchpoints.json'), 'utf8'),
);
if (em3.touchpointCount < 2000) failures.push(`em3 ${em3.touchpointCount} < 2000`);

const em4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
);
if (em4.conflictCount < 80) failures.push(`em4 ${em4.conflictCount} < 80`);

if (failures.length) {
  console.error('Planning exhaustion meta:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(
  `✓ Planning exhaustion meta — EM-3 ${em3.touchpointCount} touchpoints, EM-4 ${em4.conflictCount} conflicts`,
);
process.exit(0);
