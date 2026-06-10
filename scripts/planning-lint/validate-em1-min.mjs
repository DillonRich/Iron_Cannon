#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const em1 = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/em1-flow-steps.json'), 'utf8'));

const MIN = 2000;
const MIN_COMPLIANCE = 120;
const failures = [];

if (em1.nodeCount < MIN) failures.push(`flow steps ${em1.nodeCount} < ${MIN}`);
const compliance = em1.nodes.filter((n) => n.phase?.includes('COMPLIANCE')).length;
if (compliance < MIN_COMPLIANCE) failures.push(`compliance phases ${compliance} < ${MIN_COMPLIANCE}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ EM-1 — ${em1.nodeCount} steps (${compliance} compliance phases)`);
process.exit(0);
