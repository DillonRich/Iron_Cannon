#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const em4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
);
const MIN = 80;
const failures = [];
if (em4.conflictCount < MIN) failures.push(`conflicts ${em4.conflictCount} < ${MIN}`);
const withFixture = em4.conflicts.filter((c) => c.detectFixture).length;
if (withFixture < 4) failures.push('need >=4 detectFixture links');
const golden = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
for (const id of golden) {
  if (!em4.conflicts.some((c) => c.conflictId === id)) failures.push(`missing ${id}`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ EM-4 cross-host — ${em4.conflictCount} conflicts, ${withFixture} with fixtures`);
process.exit(0);
