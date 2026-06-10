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
    conflictId: 'CH-066',
    hosts: ['em1-lattice', 'extreme-map'],
    detectSignal: 'EM1_LATTICE_UNDER_1800',
    severity: 'warn',
    resolution: 'expand-em1-lattice-1800 before wave 52 close',
    detectFixture: 'EC-066',
    mcpToolsAffected: ['T05'],
    errorCode: 'MODULE_SEQUENCE_VIOLATION',
  },
  {
    conflictId: 'CH-067',
    hosts: ['jurisdiction', 'compose'],
    detectSignal: 'JURISDICTION_MARKET_UNDER_40',
    severity: 'warn',
    resolution: 'expand-jurisdiction-bundles-wave52 + filter T04 by projectMarkets',
    detectFixture: 'EC-067',
    mcpToolsAffected: ['T04'],
    errorCode: 'COMPLIANCE_FAILED',
  },
  {
    conflictId: 'CH-068',
    hosts: ['retrieval-60', 'corpus-10200'],
    detectSignal: 'RETRIEVAL_BASELINE_60_QUERIES',
    severity: 'warn',
    resolution: 'expand-retrieval-baseline-wave52 + calibrate after index rebuild',
    detectFixture: 'EC-068',
    mcpToolsAffected: ['T04'],
    errorCode: 'RULE_STORE_CORRUPT',
  },
  {
    conflictId: 'CH-069',
    hosts: ['em2-matrix', 'security-registry'],
    detectSignal: 'EM2_CONTROLS_STALE_AFTER_EM1_EXPAND',
    severity: 'warn',
    resolution: 'npm run planning:build-em2 after EM-1 lattice expand',
    detectFixture: 'EC-069',
    mcpToolsAffected: ['T10'],
    errorCode: 'COMPLIANCE_FAILED',
  },
  {
    conflictId: 'CH-070',
    hosts: ['armor', 'golden-loop'],
    detectSignal: 'ARMOR_PATTERN_MISSING_ON_A01_A03',
    severity: 'warn',
    resolution: 'expand-compliance-patterns-wave52 on Armor module fixtures',
    detectFixture: 'EC-070',
    mcpToolsAffected: ['T09'],
    errorCode: 'FALSE_COMPLIANCE_SUSPECTED',
  },
];

for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
em4.targetConflictCount = 70;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 52 — ${em4.conflictCount} conflicts`);
