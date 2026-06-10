#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const doc = join(ROOT, 'docs/engine/PLANNING_SCOPE_BOUNDARIES.md');
const failures = [];
if (!existsSync(doc)) failures.push('missing PLANNING_SCOPE_BOUNDARIES.md');
else {
  const t = readFileSync(doc, 'utf8');
  for (const needle of ['In scope', 'Out of scope', 'STACK_UNSUPPORTED', 'ironcannon.ai']) {
    if (!t.includes(needle)) failures.push(`scope doc missing: ${needle}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('✓ Scope boundaries doc — present and complete');
process.exit(0);
