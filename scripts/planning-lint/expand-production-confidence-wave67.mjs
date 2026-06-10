#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/production-confidence-scenarios.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.scenarios.map((s) => s.id));

const ADDED = [
  { id: 'PC-051', name: 'G2 golden integration smoke', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-golden-integration.mjs' },
  { id: 'PC-052', name: 'MCP surface audit script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-mcp-surface-audit.mjs' },
  { id: 'PC-053', name: 'Production-confidence harness script', category: 'adversarial', harness: 'planning-script', script: 'simulate-production-confidence.mjs' },
  { id: 'PC-054', name: 'Rate limit gate script', category: 'tier-churn', harness: 'g2-script', script: 'g2-rate-limit.mjs' },
  { id: 'PC-055', name: 'Armor smoke script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-armor-smoke.mjs' },
  { id: 'PC-056', name: 'Outbound chain script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-outbound-chain.mjs' },
  { id: 'PC-057', name: 'Security protocols 900+ active', category: 'adversarial', harness: 'security-protocols-floor', minActive: 900 },
  { id: 'PC-058', name: 'Retrieval baseline 150+ queries', category: 'adversarial', harness: 'retrieval-floor', minQueries: 150 },
  { id: 'PC-059', name: 'Obligation floor 180+', category: 'adversarial', harness: 'obligations-floor', minObligations: 180 },
  { id: 'PC-060', name: 'PC scenario registry 60+', category: 'adversarial', harness: 'pc-scenario-floor', minScenarios: 60 },
];

for (const s of ADDED) {
  if (!existing.has(s.id)) reg.scenarios.push(s);
}
for (const s of reg.scenarios) {
  if (['PC-019', 'PC-030', 'PC-038', 'PC-049'].includes(s.id)) s.minObligations = 180;
  if (['PC-020', 'PC-039', 'PC-050'].includes(s.id)) s.minScenarios = 1350;
  if (['PC-028', 'PC-036', 'PC-047'].includes(s.id)) s.minActive = 900;
  if (['PC-029', 'PC-037', 'PC-048'].includes(s.id)) s.minQueries = 150;
}
reg.version = '1.4.0';
reg.phase = 3;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Production-confidence wave67 — ${reg.scenarios.length} scenarios`);
