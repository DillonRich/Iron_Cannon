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
    conflictId: 'CH-038',
    hosts: ['em1-lattice', 'em0-config'],
    detectSignal: 'EM1_STEP_UNDERFLOW_800',
    severity: 'warn',
    resolution: 'Run expand-em1-lattice-800.mjs after build-em1',
    detectFixture: null,
    mcpToolsAffected: ['T03', 'T04'],
    errorCode: 'CONTEXT_INSUFFICIENT',
  },
  {
    conflictId: 'CH-039',
    hosts: ['scale-d', 'tier-c-only'],
    detectSignal: 'TIER_D_LINT_NOT_PROMOTED',
    severity: 'warn',
    resolution: 'Add validate-corpus-scale --tier=d when corpus >= 10000',
    detectFixture: 'EC-046',
    mcpToolsAffected: ['T02'],
    errorCode: 'RULE_STORE_CORRUPT',
  },
  {
    conflictId: 'CH-040',
    hosts: ['vectorize', 'token-overlap-only'],
    detectSignal: 'VECTORIZE_MANIFEST_STALE',
    severity: 'warn',
    resolution: 'npm run harvest:vectorize-manifest after each index rebuild',
    detectFixture: 'EC-036',
    mcpToolsAffected: ['T04'],
    errorCode: 'REMOTE_UNAVAILABLE',
  },
  {
    conflictId: 'CH-041',
    hosts: ['planning-bootstrap', 'vendor-harvest'],
    detectSignal: 'SCALE_D_PLANNING_HEAVY',
    severity: 'warn',
    resolution: 'Refresh llms.txt inventories; prefer vendor cards when URLs available',
    detectFixture: 'EC-042',
    mcpToolsAffected: ['T02'],
    errorCode: 'SSOT_CONFLICT',
  },
  {
    conflictId: 'CH-042',
    hosts: ['em4-matrix', 'imagination-harness'],
    detectSignal: 'EM4_CONFLICT_UNDERFLOW_50',
    severity: 'warn',
    resolution: 'append-em4-conflicts-wave46.mjs + rebuild imagination edge cases',
    detectFixture: null,
    mcpToolsAffected: ['T01'],
    errorCode: 'ENGINE_SCHEMA_FAILURE',
  },
  {
    conflictId: 'CH-043',
    hosts: ['armor-pass', 'ironclad-pass'],
    detectSignal: 'IRONCLAD_BEFORE_ARMOR',
    severity: 'block',
    resolution: 'EM-1 phase order: ARMOR_PASS before IRONCLAD_PASS in flow gates',
    detectFixture: null,
    mcpToolsAffected: ['T09', 'T12'],
    errorCode: 'MODULE_SEQUENCE_VIOLATION',
  },
  {
    conflictId: 'CH-044',
    hosts: ['compose-10k', 'c14-slicer'],
    detectSignal: 'COMPOSE_SLICE_TRUNCATED_SCALE_D',
    severity: 'warn',
    resolution: 'C14 slicer must truncate with SLICE_TRUNCATED error code',
    detectFixture: 'EC-035',
    mcpToolsAffected: ['T04'],
    errorCode: 'SLICE_TRUNCATED',
  },
  {
    conflictId: 'CH-045',
    hosts: ['market-bundle', 'flow-matrix'],
    detectSignal: 'MARKET_NOT_IN_FLOW_MATRIX',
    severity: 'warn',
    resolution: 'per-flow-scope-matrix must list scopeServices for each flow',
    detectFixture: 'EC-038',
    mcpToolsAffected: ['T12'],
    errorCode: 'SCOPE_OUT_OF_BOUNDS',
  },
  {
    conflictId: 'CH-046',
    hosts: ['security-protocol', 'planned-status'],
    detectSignal: 'SECURITY_PROTOCOL_PLANNED',
    severity: 'warn',
    resolution: 'activate-security-protocols.mjs before closing wave',
    detectFixture: null,
    mcpToolsAffected: ['T10'],
    errorCode: 'RULE_STORE_CORRUPT',
  },
  {
    conflictId: 'CH-047',
    hosts: ['extreme-map', 'psycho-scorecard'],
    detectSignal: 'EXTREME_MAP_BELOW_800',
    severity: 'warn',
    resolution: 'expand-em1-lattice-800 + validate-extreme-map-coverage',
    detectFixture: 'EC-040',
    mcpToolsAffected: ['T01'],
    errorCode: 'ENGINE_SCHEMA_FAILURE',
  },
  {
    conflictId: 'CH-048',
    hosts: ['scheduled-regression', 'lint-all'],
    detectSignal: 'REGRESSION_NOT_RUN_POST_WAVE',
    severity: 'block',
    resolution: 'npm run planning:regression && npm run lint:all each session',
    detectFixture: 'EC-040',
    mcpToolsAffected: ['T01'],
    errorCode: 'ENGINE_SCHEMA_FAILURE',
  },
  {
    conflictId: 'CH-049',
    hosts: ['d1-export', 'stripe-customer'],
    detectSignal: 'EXPORT_INCLUDES_PAYMENT_IDS',
    severity: 'warn',
    resolution: 'LEG-DATA-002 export must redact PCI-adjacent fields',
    detectFixture: 'EC-020',
    mcpToolsAffected: ['T13'],
    errorCode: 'COMPLIANCE_FAILED',
    flowId: 'data-export',
  },
  {
    conflictId: 'CH-050',
    hosts: ['webhook-stripe', 'webhook-resend'],
    detectSignal: 'DUAL_WEBHOOK_SECRET_ROTATION',
    severity: 'warn',
    resolution: 'Rotate STRIPE_WEBHOOK_SECRET and Resend signing keys independently',
    detectFixture: 'EC-003',
    mcpToolsAffected: ['T05', 'T07'],
    errorCode: 'SSOT_CONFLICT',
  },
];

for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
em4.targetConflictCount = 50;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 append wave 46 — ${em4.conflictCount} conflicts`);
