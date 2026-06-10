#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/production-confidence-scenarios.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.scenarios.map((s) => s.id));

const ADDED = [
  { id: 'PC-041', name: 'Golden protocol smoke script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-golden-protocol.mjs' },
  { id: 'PC-042', name: 'Recovery fixtures script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-recovery-fixtures.mjs' },
  { id: 'PC-043', name: 'Wiremap gate script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-wiremap-gate.mjs' },
  { id: 'PC-044', name: 'Hybrid CF Pages SD-03 fixture', category: 'out-of-scope', harness: 'stack-fixture', fixture: 'SD-03' },
  { id: 'PC-045', name: 'Wiremap W02 fixture present', category: 'deploy-smoke', harness: 'wiremap-fixture', fixture: 'W02' },
  { id: 'PC-046', name: 'Corpus depth lint script', category: 'adversarial', harness: 'planning-script', script: 'validate-corpus-depth.mjs' },
  { id: 'PC-047', name: 'Security protocols 850+ active', category: 'adversarial', harness: 'security-protocols-floor', minActive: 850 },
  { id: 'PC-048', name: 'Retrieval baseline 140+ queries', category: 'adversarial', harness: 'retrieval-floor', minQueries: 140 },
  { id: 'PC-049', name: 'Obligation floor 170+', category: 'adversarial', harness: 'obligations-floor', minObligations: 170 },
  { id: 'PC-050', name: 'Imagination extended 1300+', category: 'adversarial', harness: 'imagination-floor', minScenarios: 1300 },
];

for (const s of ADDED) {
  if (!existing.has(s.id)) reg.scenarios.push(s);
}
for (const s of reg.scenarios) {
  if (s.id === 'PC-019' || s.id === 'PC-030' || s.id === 'PC-038') s.minObligations = 170;
  if (s.id === 'PC-020' || s.id === 'PC-039') s.minScenarios = 1300;
  if (s.id === 'PC-028' || s.id === 'PC-036') s.minActive = 850;
  if (s.id === 'PC-029' || s.id === 'PC-037') s.minQueries = 140;
}
reg.version = '1.3.0';
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Production-confidence wave66 — ${reg.scenarios.length} scenarios`);
