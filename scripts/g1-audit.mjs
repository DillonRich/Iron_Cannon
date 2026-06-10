#!/usr/bin/env node
/** G-1 deliverable audit — run before G-2 waves */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const required = [
  'packages/schemas/rule-fragment.v1.json',
  'packages/schemas/reference-card.v1.json',
  'packages/schemas/compliance-result.v1.json',
  'packages/schemas/wiremap-payload.v1.json',
  'packages/schemas/module-directive.v1.json',
  'packages/compose/src/index.js',
  'packages/mcp-core/src/tier-gate.js',
  'packages/verify/src/index.js',
  'apps/mcp-worker/src/index.js',
  'docs/engine/planning/tier-entitlement-matrix.json',
  'docs/engine/PLANNING_IMPLEMENTATION_GATE.md',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

for (const f of readdirSync(join(ROOT, 'packages/schemas')).filter((x) => x.endsWith('.json'))) {
  try {
    JSON.parse(readFileSync(join(ROOT, 'packages/schemas', f), 'utf8'));
  } catch {
    failures.push(`invalid JSON packages/schemas/${f}`);
  }
}

const r = spawnSync(process.execPath, [join(ROOT, 'scripts/g1-smoke.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (r.status !== 0) failures.push(`g1:smoke failed\n${r.stderr}`);

if (failures.length) {
  console.error('G-1 audit FAILED:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ G-1 audit — deliverables present, schemas parse, smoke pass');
process.exit(0);
