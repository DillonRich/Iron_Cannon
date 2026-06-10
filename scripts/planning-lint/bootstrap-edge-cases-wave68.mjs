#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.edgeCases.map((c) => c.id));
const added = [
  { id: 'EC-106', category: 'agent', signal: 'AGENT_WIREMAP_BYPASS', tools: ['T04'], mitigation: 'simulate-adversarial-agent', imaginationRef: 'IMG-1351' },
  { id: 'EC-107', category: 'agent', signal: 'AGENT_TIER_BYPASS', tools: ['T10'], mitigation: 'expand-em1-adversarial-links-wave68', imaginationRef: 'IMG-1352' },
  { id: 'EC-108', category: 'agent', signal: 'ADVERSARIAL_HARNESS_NOT_RUN', tools: ['T11'], mitigation: 'g2-adversarial-agent', imaginationRef: 'IMG-1353' },
  { id: 'EC-109', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_UNDER_160', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave68', imaginationRef: 'IMG-1354' },
  { id: 'EC-110', category: 'ironclad', signal: 'OBLIGATION_UNDER_190', tools: ['T12'], mitigation: 'bootstrap-obligations-wave68', imaginationRef: 'IMG-1355' },
];
for (const c of added) {
  if (!existing.has(c.id)) reg.edgeCases.push(c);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 68 — ${reg.edgeCaseCount} cases`);
