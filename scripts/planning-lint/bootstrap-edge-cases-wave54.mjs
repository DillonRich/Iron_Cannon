#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const added = [
  { id: 'EC-076', category: 'em1', signal: 'EM1_2200_MARKET_LATTICE', tools: ['T04'], mitigation: 'expand-em1-lattice-2200', imaginationRef: 'IMG-318' },
  { id: 'EC-077', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_75', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave54', imaginationRef: 'IMG-319' },
  { id: 'EC-078', category: 'security', signal: 'SECURITY_PROTOCOL_UNDER_550', tools: ['T10'], mitigation: 'expand-security-protocol-registry-wave54', imaginationRef: 'IMG-320' },
  { id: 'EC-079', category: 'legal', signal: 'JURISDICTION_MARKET_UNDER_50', tools: ['T04'], mitigation: 'expand-jurisdiction-bundles-wave54', imaginationRef: 'IMG-321' },
  { id: 'EC-080', category: 'quality', signal: 'STRETCH_SUITE_NOT_RUN', tools: ['T01'], mitigation: 'npm run planning:stretch-test', imaginationRef: 'IMG-322' },
];
const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) if (!existing.has(ec.id)) reg.edgeCases.push(ec);
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 54 — ${reg.edgeCaseCount}`);
