#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-106', hosts: ['agent', 'wiremap'], detectSignal: 'AGENT_WIREMAP_BYPASS', severity: 'warn', resolution: 'simulate-adversarial-agent', detectFixture: 'EC-106', mcpToolsAffected: ['T04'], errorCode: 'WIREMAP_NOT_APPROVED' },
  { conflictId: 'CH-107', hosts: ['agent', 'tier'], detectSignal: 'AGENT_TIER_BYPASS', severity: 'warn', resolution: 'expand-em1-adversarial-links-wave68', detectFixture: 'EC-107', mcpToolsAffected: ['T10'], errorCode: 'TIER_INSUFFICIENT' },
  { conflictId: 'CH-108', hosts: ['agent', 'production'], detectSignal: 'ADVERSARIAL_HARNESS_NOT_RUN', severity: 'warn', resolution: 'g2-adversarial-agent', detectFixture: 'EC-108', mcpToolsAffected: ['T11'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-109', hosts: ['retrieval'], detectSignal: 'RETRIEVAL_BASELINE_UNDER_160', severity: 'warn', resolution: 'expand-retrieval-baseline-wave68', detectFixture: 'EC-109', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-110', hosts: ['ironclad'], detectSignal: 'OBLIGATION_UNDER_190', severity: 'warn', resolution: 'bootstrap-obligations-wave68', detectFixture: 'EC-110', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 68 — ${em4.conflictCount} conflicts`);
