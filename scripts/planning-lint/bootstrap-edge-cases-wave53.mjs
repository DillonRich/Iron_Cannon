#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const added = [
  { id: 'EC-071', category: 'em1', signal: 'EM1_2000_EM0_500_STRETCH', tools: ['T05'], mitigation: 'expand-em1-lattice-2000 + expand-em0-config-wave53', imaginationRef: 'IMG-308' },
  { id: 'EC-072', category: 'legal', signal: 'OBLIGATION_COUNT_UNDER_100', tools: ['T12'], mitigation: 'bootstrap-obligations-wave53', imaginationRef: 'IMG-309' },
  { id: 'EC-073', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_65', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave53 + calibrate', imaginationRef: 'IMG-310' },
  { id: 'EC-074', category: 'security', signal: 'SECURITY_PROTOCOL_UNDER_500', tools: ['T10'], mitigation: 'expand-security-protocol-registry-wave53', imaginationRef: 'IMG-311' },
  { id: 'EC-075', category: 'legal', signal: 'JURISDICTION_MARKET_UNDER_45', tools: ['T04'], mitigation: 'expand-jurisdiction-bundles-wave53', imaginationRef: 'IMG-312' },
];
const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 53 — ${reg.edgeCaseCount}`);
