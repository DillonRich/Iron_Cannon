#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const matrix = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/tier-entitlement-matrix.json'), 'utf8'),
);

const TIER_RANK = matrix.tierRank;
const failures = [];

function tierAllows(tier, toolName) {
  const def = matrix.tools.find((t) => t.name === toolName);
  if (!def || def.location === 'local') return true;
  return TIER_RANK[tier] >= TIER_RANK[def.tierMin];
}

for (const dt of matrix.deniedTests ?? []) {
  if (tierAllows(dt.tier, dt.tool)) {
    failures.push(`${dt.tier} should not access ${dt.tool}`);
  }
}

if (matrix.tools.length !== 14) failures.push(`expected 14 tools, got ${matrix.tools.length}`);

const pro = matrix.composeEntitlements.pro;
if (!pro.forbiddenRefIdPrefixes.includes('legal/')) {
  failures.push('pro must forbid legal/ refIds');
}
if (pro.includeEm3LegalTouchpoints) failures.push('pro must not include EM-3');

for (const t of ['T09', 'T10', 'T11', 'T12', 'T13', 'T14']) {
  const tool = matrix.tools.find((x) => x.id === t);
  if (!tool) failures.push(`missing tool ${t}`);
}

const doc = readFileSync(join(ROOT, 'docs/engine/PLANNING_TIER_CAPABILITY_MATRIX.md'), 'utf8');
if (!doc.includes('TIER_INSUFFICIENT')) failures.push('PLANNING_TIER_CAPABILITY_MATRIX missing TIER_INSUFFICIENT');

if (failures.length) {
  console.error('Tier entitlement failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ Tier entitlement matrix — 14 tools, Pro legal blocked, denied tests OK');
process.exit(0);
