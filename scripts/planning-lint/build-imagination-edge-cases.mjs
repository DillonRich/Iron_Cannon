#!/usr/bin/env node
/** Append EC-* scenarios to imagination-100-scenarios.json */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const edge = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'),
);
const reg = JSON.parse(readFileSync(regPath, 'utf8'));

const existing = new Set(reg.scenarios.map((s) => s.id));
const edgeScenarios = edge.edgeCases.map((ec, i) => ({
  id: `IMG-${(101 + i).toString().padStart(3, '0')}`,
  name: `Edge ${ec.id} ${ec.signal}`,
  harness: 'edge-case',
  edgeCaseId: ec.id,
  minPassRate: 0.9,
}));

const merged = [...reg.scenarios];
for (const s of edgeScenarios) {
  if (!existing.has(s.id)) merged.push(s);
}

const out = {
  ...reg,
  extendedEdgeCount: edgeScenarios.length,
  scenarios: merged,
  scenarioCount: merged.length,
};

writeFileSync(regPath, JSON.stringify(out, null, 2) + '\n');
console.log(`✓ Imagination edge — ${edgeScenarios.length} scenarios (total ${merged.length})`);
