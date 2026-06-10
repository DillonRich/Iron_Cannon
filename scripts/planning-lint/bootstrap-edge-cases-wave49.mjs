#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-051',
    category: 'retrieval',
    signal: 'RETRIEVAL_BASELINE_40_QUERIES',
    tools: ['T04'],
    mitigation: 'expand-retrieval-baseline-wave49 + calibrate top-3',
    imaginationRef: 'IMG-266',
  },
  {
    id: 'EC-052',
    category: 'security',
    signal: 'SECURITY_PROTOCOL_UNDER_300',
    tools: ['T10'],
    mitigation: 'expand-security-protocol-registry-wave49 + activate-security-protocols',
    imaginationRef: 'IMG-267',
  },
  {
    id: 'EC-053',
    category: 'agent',
    signal: 'AGENT_DIRECTIVE_TEMPLATE_GAP',
    tools: ['T04'],
    mitigation: 'expand-agent-directive-templates-wave49',
    imaginationRef: 'IMG-268',
  },
  {
    id: 'EC-054',
    category: 'cloudflare',
    signal: 'VECTORIZE_DEFERRED_PLANNING_ONLY',
    tools: ['T04'],
    mitigation: 'harvest-data/vectorize-manifest.json export only; no CF API until creds',
    imaginationRef: 'IMG-269',
  },
  {
    id: 'EC-055',
    category: 'quality',
    signal: 'PLANNING_QUALITY_GATE_STALE',
    tools: ['T01'],
    mitigation: 'npm run planning:regression && npm run lint:all each session',
    imaginationRef: 'IMG-270',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 49 — ${reg.edgeCaseCount} total`);
