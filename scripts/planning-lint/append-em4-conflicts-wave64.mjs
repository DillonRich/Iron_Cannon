#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));
const added = [
  { conflictId: 'CH-086', hosts: ['stripe', 'em1'], detectSignal: 'STRIPE_WEBHOOK_UNSIGNED', severity: 'warn', resolution: 'expand-em1-stripe-cf-links-wave64', detectFixture: 'EC-086', mcpToolsAffected: ['T05'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-087', hosts: ['cloudflare', 'auth'], detectSignal: 'TURNSTILE_MISSING_ON_AUTH', severity: 'warn', resolution: 'bootstrap-corpus-knowledge-wave64', detectFixture: 'EC-087', mcpToolsAffected: ['T10'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-088', hosts: ['retrieval'], detectSignal: 'RETRIEVAL_BASELINE_UNDER_120', severity: 'warn', resolution: 'expand-retrieval-baseline-wave64', detectFixture: 'EC-088', mcpToolsAffected: ['T04'], errorCode: 'RULE_STORE_CORRUPT' },
  { conflictId: 'CH-089', hosts: ['legal', 'ironclad'], detectSignal: 'GDPR_PORTABILITY_ROUTE_MISSING', severity: 'warn', resolution: 'bootstrap-obligations-wave64', detectFixture: 'EC-089', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
  { conflictId: 'CH-090', hosts: ['ironclad'], detectSignal: 'OBLIGATION_UNDER_150', severity: 'warn', resolution: 'bootstrap-obligations-wave64', detectFixture: 'EC-090', mcpToolsAffected: ['T12'], errorCode: 'COMPLIANCE_FAILED' },
];
for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 64 — ${em4.conflictCount} conflicts`);
