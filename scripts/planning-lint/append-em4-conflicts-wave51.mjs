#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
const em4 = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(em4.conflicts.map((c) => c.conflictId));

const added = [
  {
    conflictId: 'CH-061',
    hosts: ['em1-lattice', 'em2-matrix'],
    detectSignal: 'EM1_LATTICE_UNDER_1500',
    severity: 'warn',
    resolution: 'expand-em1-lattice-1500 before closing wave 51',
    detectFixture: 'EC-061',
    mcpToolsAffected: ['T05'],
    errorCode: 'MODULE_SEQUENCE_VIOLATION',
  },
  {
    conflictId: 'CH-062',
    hosts: ['jurisdiction', 'em3-touchpoints'],
    detectSignal: 'JURISDICTION_MARKET_UNDER_35',
    severity: 'warn',
    resolution: 'expand-jurisdiction-bundles-wave51 + rebuild EM-3',
    detectFixture: 'EC-062',
    mcpToolsAffected: ['T04'],
    errorCode: 'COMPLIANCE_FAILED',
  },
  {
    conflictId: 'CH-063',
    hosts: ['corpus', 'retrieval-55'],
    detectSignal: 'RETRIEVAL_BASELINE_55_QUERIES',
    severity: 'warn',
    resolution: 'expand-retrieval-baseline-wave51 + calibrate after index rebuild',
    detectFixture: 'EC-063',
    mcpToolsAffected: ['T04'],
    errorCode: 'RULE_STORE_CORRUPT',
  },
  {
    conflictId: 'CH-064',
    hosts: ['security-registry', 'em2-matrix'],
    detectSignal: 'SECURITY_PROTOCOL_UNDER_400',
    severity: 'warn',
    resolution: 'expand-security-protocol-registry-wave51 + build-em2',
    detectFixture: 'EC-064',
    mcpToolsAffected: ['T10'],
    errorCode: 'COMPLIANCE_FAILED',
  },
  {
    conflictId: 'CH-065',
    hosts: ['vectorize-manifest', 'corpus-overflow'],
    detectSignal: 'VECTORIZE_MANIFEST_STALE_POST_W51_CARDS',
    severity: 'info',
    resolution: 'harvest:vectorize-manifest export only; no live CF upsert',
    detectFixture: 'EC-065',
    mcpToolsAffected: ['T04'],
    errorCode: 'REMOTE_UNAVAILABLE',
  },
];

for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
em4.targetConflictCount = 65;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 51 — ${em4.conflictCount} conflicts`);
