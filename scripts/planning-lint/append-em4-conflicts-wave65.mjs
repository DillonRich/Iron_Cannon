#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-091', hosts: ['legal', 'cookie'], detectSignal: 'COOKIE_CONSENT_MISSING', severity: 'warn', resolution: 'bootstrap-obligations-wave65', detectFixture: 'EC-091', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-092', hosts: ['legal', 'ai'], detectSignal: 'AI_DISCLOSURE_MISSING', severity: 'warn', resolution: 'bootstrap-missing-obligation-refs-wave65', detectFixture: 'EC-092', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-093', hosts: ['retrieval'], detectSignal: 'RETRIEVAL_BASELINE_UNDER_130', severity: 'warn', resolution: 'expand-retrieval-baseline-wave65', detectFixture: 'EC-093', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-094', hosts: ['resend', 'email'], detectSignal: 'RESEND_DOMAIN_UNVERIFIED', severity: 'warn', resolution: 'bootstrap-corpus-knowledge-wave65', detectFixture: 'EC-094', mcpToolsAffected: ['T05'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-095', hosts: ['ironclad'], detectSignal: 'OBLIGATION_UNDER_160', severity: 'warn', resolution: 'bootstrap-obligations-wave65', detectFixture: 'EC-095', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 65 — ${em4.conflictCount} conflicts`);
