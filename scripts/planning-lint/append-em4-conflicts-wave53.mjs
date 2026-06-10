#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-071', hosts: ['em1', 'em0'], detectSignal: 'EM1_2000_EM0_500_STRETCH', severity: 'warn', resolution: 'wave53 lattice + em0 expand', detectFixture: 'EC-071', mcpToolsAffected: ['T05'], errorCode: 'MODULE_SEQUENCE_VIOLATION' },
  { conflictId: 'CH-072', hosts: ['obligations', 'l4'], detectSignal: 'OBLIGATION_COUNT_UNDER_100', severity: 'warn', resolution: 'bootstrap-obligations-wave53', detectFixture: 'EC-072', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-073', hosts: ['retrieval', 'corpus'], detectSignal: 'RETRIEVAL_BASELINE_65', severity: 'warn', resolution: 'expand-retrieval-baseline-wave53', detectFixture: 'EC-073', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-074', hosts: ['security', 'registry'], detectSignal: 'SECURITY_PROTOCOL_UNDER_500', severity: 'warn', resolution: 'expand-security-protocol-registry-wave53', detectFixture: 'EC-074', mcpToolsAffected: ['T10'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-075', hosts: ['jurisdiction', 'compose'], detectSignal: 'JURISDICTION_MARKET_UNDER_45', severity: 'warn', resolution: 'expand-jurisdiction-bundles-wave53', detectFixture: 'EC-075', mcpToolsAffected: ['T04'], errorCode: 'COMPLIANCE_FAILED' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
em4.targetConflictCount = 75;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 53 — ${em4.conflictCount} conflicts`);
