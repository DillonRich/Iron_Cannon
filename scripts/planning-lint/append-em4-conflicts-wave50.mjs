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
    conflictId: 'CH-056',
    hosts: ['retrieval-50', 'token-overlap'],
    detectSignal: 'RETRIEVAL_BASELINE_50_QUERIES',
    severity: 'warn',
    resolution: 'expand-retrieval-baseline-wave50 + calibrate after index rebuild',
    detectFixture: 'EC-056',
    mcpToolsAffected: ['T04'],
    errorCode: 'RULE_STORE_CORRUPT',
  },
  {
    conflictId: 'CH-057',
    hosts: ['security-registry', 'em2-matrix'],
    detectSignal: 'SECURITY_PROTOCOL_UNDER_350',
    severity: 'warn',
    resolution: 'expand-security-protocol-registry-wave50 + build-em2',
    detectFixture: 'EC-057',
    mcpToolsAffected: ['T10'],
    errorCode: 'COMPLIANCE_FAILED',
  },
  {
    conflictId: 'CH-058',
    hosts: ['imagination-280', 'edge-registry'],
    detectSignal: 'IMAGINATION_EXTENDED_UNDERFLOOR',
    severity: 'warn',
    resolution: 'build-imagination-phase-n after edge EC-056..060',
    detectFixture: 'EC-058',
    mcpToolsAffected: ['T01'],
    errorCode: 'CONTEXT_INSUFFICIENT',
  },
  {
    conflictId: 'CH-059',
    hosts: ['harvest', 'corpus-10k'],
    detectSignal: 'VENDOR_HARVEST_STALE_NO_NEW_CARDS',
    severity: 'info',
    resolution: 'harvest:balance when URLs refresh; planning bootstrap otherwise',
    detectFixture: 'EC-059',
    mcpToolsAffected: ['T04'],
    errorCode: 'REMOTE_UNAVAILABLE',
  },
  {
    conflictId: 'CH-060',
    hosts: ['per-flow-matrix', 'sp50-protocols'],
    detectSignal: 'MATRIX_PROTOCOL_ID_DRIFT',
    severity: 'warn',
    resolution: 'expand-per-flow-scope-wave50 uses registry-valid sp50-* ids only',
    detectFixture: 'EC-060',
    mcpToolsAffected: ['T12'],
    errorCode: 'RULE_NOT_FOUND',
  },
];

for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
em4.targetConflictCount = 60;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 50 — ${em4.conflictCount} conflicts`);
