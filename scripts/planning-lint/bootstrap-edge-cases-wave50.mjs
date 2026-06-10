#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-056',
    category: 'retrieval',
    signal: 'RETRIEVAL_BASELINE_50_QUERIES',
    tools: ['T04'],
    mitigation: 'expand-retrieval-baseline-wave50 + calibrate-retrieval-baseline',
    imaginationRef: 'IMG-275',
  },
  {
    id: 'EC-057',
    category: 'security',
    signal: 'SECURITY_PROTOCOL_UNDER_350',
    tools: ['T10'],
    mitigation: 'expand-security-protocol-registry-wave50 + activate-security-protocols',
    imaginationRef: 'IMG-276',
  },
  {
    id: 'EC-058',
    category: 'imagination',
    signal: 'IMAGINATION_EXTENDED_UNDER_280',
    tools: ['T01'],
    mitigation: 'build-imagination-phase-n harness scenarios',
    imaginationRef: 'IMG-277',
  },
  {
    id: 'EC-059',
    category: 'harvest',
    signal: 'VENDOR_HARVEST_STALE_NO_NEW_CARDS',
    tools: ['T04'],
    mitigation: 'planning bootstrap cards; harvest:balance when vendor URLs refresh',
    imaginationRef: 'IMG-278',
  },
  {
    id: 'EC-060',
    category: 'matrix',
    signal: 'MATRIX_PROTOCOL_ID_DRIFT',
    tools: ['T12'],
    mitigation: 'expand-per-flow-scope-wave50 reads registry before enriching matrix',
    imaginationRef: 'IMG-279',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 50 — ${reg.edgeCaseCount} total`);
