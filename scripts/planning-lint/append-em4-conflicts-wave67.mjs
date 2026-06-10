#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-101', hosts: ['mcp', 'owasp'], detectSignal: 'MCP_TOOL_UNAUTHORIZED', severity: 'warn', resolution: 'expand-em1-production-links-wave67', detectFixture: 'EC-101', mcpToolsAffected: ['T04'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-102', hosts: ['rag', 'compose'], detectSignal: 'RAG_CHUNK_UNVALIDATED', severity: 'warn', resolution: 'bootstrap-obligations-wave67', detectFixture: 'EC-102', mcpToolsAffected: ['T04'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-103', hosts: ['production'], detectSignal: 'PC_HARNESS_NOT_RUN', severity: 'warn', resolution: 'expand-production-confidence-wave67', detectFixture: 'EC-103', mcpToolsAffected: ['T11'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-104', hosts: ['retrieval'], detectSignal: 'RETRIEVAL_BASELINE_UNDER_150', severity: 'warn', resolution: 'expand-retrieval-baseline-wave67', detectFixture: 'EC-104', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-105', hosts: ['ironclad'], detectSignal: 'OBLIGATION_UNDER_180', severity: 'warn', resolution: 'bootstrap-obligations-wave67', detectFixture: 'EC-105', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 67 — ${em4.conflictCount} conflicts`);
