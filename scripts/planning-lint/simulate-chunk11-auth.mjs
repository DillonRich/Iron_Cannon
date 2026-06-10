#!/usr/bin/env node
/** Chunk 11 — tier gate + auth prefix checks (planning mocks) */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY = [
  { name: 'analyze_project_stack', tierMin: 'pro', location: 'local' },
  { name: 'map_vulnerability_surfaces', tierMin: 'armor', location: 'remote' },
  { name: 'map_compliance_obligations', tierMin: 'ironclad', location: 'remote' },
];

const TIER_RANK = { pro: 1, armor: 2, ironclad: 3 };

function tierAllows(tier, tool) {
  const def = REGISTRY.find((t) => t.name === tool);
  if (!def || def.location === 'local') return true;
  return TIER_RANK[tier] >= TIER_RANK[def.tierMin];
}

function parseBearer(header) {
  if (!header?.startsWith('Bearer ')) return { code: 'AUTH_MISSING' };
  const token = header.slice(7).trim();
  if (!/^ic_(live|test)_/.test(token)) return { code: 'AUTH_INVALID' };
  return { ok: true, token };
}

const tests = [
  () => {
    if (!tierAllows('pro', 'map_vulnerability_surfaces')) return;
    throw new Error('pro should not get T09');
  },
  () => {
    if (!tierAllows('armor', 'map_vulnerability_surfaces')) throw new Error('armor should get T09');
  },
  () => {
    if (!tierAllows('ironclad', 'map_compliance_obligations')) throw new Error('ironclad T12');
  },
  () => {
    if (parseBearer('Bearer ic_test_abc').ok !== true) throw new Error('valid token');
  },
  () => {
    if (parseBearer(undefined).code !== 'AUTH_MISSING') throw new Error('missing auth');
  },
];

const failures = [];
for (const t of tests) {
  try {
    t();
  } catch (e) {
    failures.push(e.message);
  }
}

if (failures.length) {
  console.error('Chunk 11 auth failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ Chunk 11 C09/C10/C11 — tier + bearer prefix OK');
process.exit(0);
