#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-081', hosts: ['owasp', 'em1'], detectSignal: 'OWASP_CHEATSHEET_UNLINKED', severity: 'warn', resolution: 'expand-em1-owasp-links-wave63', detectFixture: 'EC-081', mcpToolsAffected: ['T10'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-082', hosts: ['obligation', 'corpus'], detectSignal: 'OBLIGATION_SOURCE_REF_MISSING', severity: 'warn', resolution: 'bootstrap-obligation-source-ref-cards-wave63', detectFixture: 'EC-082', mcpToolsAffected: ['T13'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-083', hosts: ['retrieval'], detectSignal: 'RETRIEVAL_BASELINE_UNDER_110', severity: 'warn', resolution: 'expand-retrieval-baseline-wave63', detectFixture: 'EC-083', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-084', hosts: ['knowledge'], detectSignal: 'CORPUS_UNDER_10800', severity: 'info', resolution: 'harvest:owasp-cheatsheets + harvest:vendor-depth', detectFixture: 'EC-084', mcpToolsAffected: ['T04'], errorCode: 'CONTEXT_INSUFFICIENT' },
  { conflictId: 'CH-085', hosts: ['ironclad'], detectSignal: 'OBLIGATION_UNDER_140', severity: 'warn', resolution: 'bootstrap-obligations-wave63', detectFixture: 'EC-085', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 63 — ${em4.conflictCount} conflicts`);
