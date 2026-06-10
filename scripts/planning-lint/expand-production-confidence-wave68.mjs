#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/production-confidence-scenarios.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.scenarios.map((s) => s.id));

const ADDED = [
  { id: 'PC-061', name: 'Adversarial agent registry 10+', category: 'adversarial', harness: 'adversarial-agent-floor', minScenarios: 10 },
  { id: 'PC-062', name: 'Adversarial agent g2 script', category: 'adversarial', harness: 'g2-script', script: 'g2-adversarial-agent.mjs' },
  { id: 'PC-063', name: 'Wiremap armor overlay smoke', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-wiremap-armor-overlay.mjs' },
  { id: 'PC-064', name: 'Observability smoke script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-observability.mjs' },
  { id: 'PC-065', name: 'MCP protocol smoke script', category: 'deploy-smoke', harness: 'g2-script', script: 'g2-mcp-protocol-smoke.mjs' },
  { id: 'PC-066', name: 'Security protocols 950+ active', category: 'adversarial', harness: 'security-protocols-floor', minActive: 950 },
  { id: 'PC-067', name: 'Retrieval baseline 160+ queries', category: 'adversarial', harness: 'retrieval-floor', minQueries: 160 },
  { id: 'PC-068', name: 'Obligation floor 190+', category: 'adversarial', harness: 'obligations-floor', minObligations: 190 },
  { id: 'PC-069', name: 'Imagination extended 1400+', category: 'adversarial', harness: 'imagination-floor', minScenarios: 1400 },
  { id: 'PC-070', name: 'PC scenario registry 70+', category: 'adversarial', harness: 'pc-scenario-floor', minScenarios: 70 },
];

for (const s of ADDED) {
  if (!existing.has(s.id)) reg.scenarios.push(s);
}
for (const s of reg.scenarios) {
  if (['PC-019', 'PC-030', 'PC-038', 'PC-049', 'PC-059', 'PC-068'].includes(s.id)) s.minObligations = 190;
  if (['PC-020', 'PC-039', 'PC-050', 'PC-069'].includes(s.id)) s.minScenarios = 1400;
  if (['PC-028', 'PC-036', 'PC-047', 'PC-057', 'PC-066'].includes(s.id)) s.minActive = 950;
  if (['PC-029', 'PC-037', 'PC-048', 'PC-058', 'PC-067'].includes(s.id)) s.minQueries = 160;
  if (s.id === 'PC-060') s.minScenarios = 70;
}
reg.version = '1.5.0';
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Production-confidence wave68 — ${reg.scenarios.length} scenarios`);
