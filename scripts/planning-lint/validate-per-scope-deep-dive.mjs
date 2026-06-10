#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DOC = join(ROOT, 'docs/engine/PLANNING_PER_SCOPE_SERVICE_DEEP_DIVE.md');
const MATRIX = join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json');

const failures = [];
if (!existsSync(DOC)) failures.push('missing PLANNING_PER_SCOPE_SERVICE_DEEP_DIVE.md');
const doc = readFileSync(DOC, 'utf8');
for (const svc of ['Stripe', 'Cloudflare', 'Resend', 'Next.js', 'OWASP']) {
  if (!doc.includes(svc)) failures.push(`doc missing section ${svc}`);
}

const matrix = JSON.parse(readFileSync(MATRIX, 'utf8'));
if (matrix.flowCount < 7) failures.push(`flowCount ${matrix.flowCount} < 7`);

if (failures.length) {
  console.error('Per-scope deep dive failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Per-scope deep dive — doc + ${matrix.flowCount} flows`);
process.exit(0);
