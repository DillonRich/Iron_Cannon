#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/production-confidence-scenarios.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.scenarios.map((s) => s.id));

const ADDED = [
  { id: 'PC-031', name: 'Golden stack SD-01 fixture', category: 'deploy-smoke', harness: 'stack-fixture', fixture: 'SD-01' },
  { id: 'PC-032', name: 'Incomplete Stripe SD-05 fixture', category: 'adversarial', harness: 'stack-fixture', fixture: 'SD-05' },
  { id: 'PC-033', name: 'Wiremap W01 fixture present', category: 'deploy-smoke', harness: 'wiremap-fixture', fixture: 'W01' },
  { id: 'PC-034', name: 'Integration matrix registry floor', category: 'adversarial', harness: 'integration-matrix-floor', minRows: 47 },
  { id: 'PC-035', name: 'Gap register all closed', category: 'adversarial', harness: 'gap-register-closed' },
  { id: 'PC-036', name: 'Security protocols 800+ active', category: 'adversarial', harness: 'security-protocols-floor', minActive: 800 },
  { id: 'PC-037', name: 'Retrieval baseline 130+ queries', category: 'adversarial', harness: 'retrieval-floor', minQueries: 130 },
  { id: 'PC-038', name: 'Obligation floor 160+', category: 'adversarial', harness: 'obligations-floor', minObligations: 160 },
  { id: 'PC-039', name: 'Imagination extended 1200+', category: 'adversarial', harness: 'imagination-floor', minScenarios: 1250 },
  { id: 'PC-040', name: 'IronClad smoke script present', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-ironclad-smoke.mjs' },
];

for (const s of ADDED) {
  if (!existing.has(s.id)) reg.scenarios.push(s);
}
for (const s of reg.scenarios) {
  if (s.id === 'PC-019' || s.id === 'PC-030') s.minObligations = 160;
  if (s.id === 'PC-020') s.minScenarios = 1250;
  if (s.id === 'PC-028') s.minActive = 800;
  if (s.id === 'PC-029') s.minQueries = 130;
}
reg.version = '1.2.0';
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Production-confidence wave65 — ${reg.scenarios.length} scenarios`);
