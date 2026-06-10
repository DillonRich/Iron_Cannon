#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-096', hosts: ['nextjs', 'auth'], detectSignal: 'MIDDLEWARE_AUTH_BYPASS', severity: 'warn', resolution: 'expand-em1-nextjs-owasp-links-wave66', detectFixture: 'EC-096', mcpToolsAffected: ['T05'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-097', hosts: ['owasp', 'ui'], detectSignal: 'XSS_UNENCODED_OUTPUT', severity: 'warn', resolution: 'bootstrap-obligations-wave66', detectFixture: 'EC-097', mcpToolsAffected: ['T10'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-098', hosts: ['tgs', 'ironclad'], detectSignal: 'TGS_V2_OBLIGATION_TRIGGER', severity: 'info', resolution: 'record-tgs-v2-rebaseline-wave66', detectFixture: 'EC-098', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-099', hosts: ['retrieval'], detectSignal: 'RETRIEVAL_BASELINE_UNDER_140', severity: 'warn', resolution: 'expand-retrieval-baseline-wave66', detectFixture: 'EC-099', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-100', hosts: ['ironclad'], detectSignal: 'OBLIGATION_UNDER_170', severity: 'warn', resolution: 'bootstrap-obligations-wave66', detectFixture: 'EC-100', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 66 — ${em4.conflictCount} conflicts`);
