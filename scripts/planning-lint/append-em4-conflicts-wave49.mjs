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
    conflictId: 'CH-051',
    hosts: ['retrieval-40', 'token-overlap'],
    detectSignal: 'RETRIEVAL_BASELINE_LARGE_CORPUS_10K',
    severity: 'warn',
    resolution: 'calibrate-retrieval-baseline after each index rebuild',
    detectFixture: 'EC-033',
    mcpToolsAffected: ['T04'],
    errorCode: 'RULE_STORE_CORRUPT',
  },
  {
    conflictId: 'CH-052',
    hosts: ['agent-directive', 'em1-lattice'],
    detectSignal: 'DIRECTIVE_TEMPLATE_MISSING_PHASE',
    severity: 'warn',
    resolution: 'agent-directive-templates.json must cover TOOL_GATE and MONITOR',
    mcpToolsAffected: ['T04'],
    errorCode: 'CONTEXT_INSUFFICIENT',
  },
  {
    conflictId: 'CH-053',
    hosts: ['compliance-pattern', 'module-fixture'],
    detectSignal: 'PATTERN_DENSITY_UNDERFLOW',
    severity: 'warn',
    resolution: 'expand-compliance-patterns-wave49 on golden module fixtures',
    mcpToolsAffected: ['T05'],
    errorCode: 'COMPLIANCE_FAILED',
  },
  {
    conflictId: 'CH-054',
    hosts: ['vectorize', 'cloudflare'],
    detectSignal: 'VECTORIZE_DEFERRED_NO_CF_CREDS',
    severity: 'info',
    resolution: 'Use token-overlap retrieval until Vectorize creds available',
    detectFixture: 'EC-049',
    mcpToolsAffected: ['T04'],
    errorCode: 'REMOTE_UNAVAILABLE',
  },
  {
    conflictId: 'CH-055',
    hosts: ['per-flow-matrix', 'security-registry'],
    detectSignal: 'UNKNOWN_PROTOCOL_IN_MATRIX',
    severity: 'warn',
    resolution: 'expand-per-flow-scope-wave49 links planning/sp49-* protocols',
    mcpToolsAffected: ['T12'],
    errorCode: 'RULE_NOT_FOUND',
  },
];

for (const c of added) {
  if (!existing.has(c.conflictId)) em4.conflicts.push(c);
}
em4.conflictCount = em4.conflicts.length;
writeFileSync(path, JSON.stringify(em4, null, 2) + '\n');
console.log(`✓ EM-4 wave 49 — ${em4.conflictCount} conflicts`);
