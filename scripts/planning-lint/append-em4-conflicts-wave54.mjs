#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-076', hosts: ['em1', 'markets'], detectSignal: 'EM1_2200_MARKET_LATTICE', severity: 'warn', resolution: 'expand-em1-lattice-2200', detectFixture: 'EC-076', mcpToolsAffected: ['T04'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-077', hosts: ['retrieval'], detectSignal: 'RETRIEVAL_BASELINE_75', severity: 'warn', resolution: 'expand-retrieval-baseline-wave54', detectFixture: 'EC-077', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-078', hosts: ['protocols'], detectSignal: 'SECURITY_PROTOCOL_UNDER_550', severity: 'warn', resolution: 'expand-security-protocol-registry-wave54', detectFixture: 'EC-078', mcpToolsAffected: ['T10'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-079', hosts: ['jurisdiction'], detectSignal: 'JURISDICTION_MARKET_UNDER_50', severity: 'warn', resolution: 'expand-jurisdiction-bundles-wave54', detectFixture: 'EC-079', mcpToolsAffected: ['T04'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-080', hosts: ['planning-test'], detectSignal: 'STRETCH_SUITE_NOT_RUN', severity: 'info', resolution: 'npm run planning:stretch-test each session', detectFixture: 'EC-080', mcpToolsAffected: ['T01'], errorCode: 'CONTEXT_INSUFFICIENT' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
em4.targetConflictCount = 80;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 54 — ${em4.conflictCount}`);
