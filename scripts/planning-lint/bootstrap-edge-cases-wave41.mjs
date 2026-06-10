#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-033',
    category: 'corpus',
    signal: 'RETRIEVAL_MISS_LARGE_CORPUS',
    tools: ['T04'],
    mitigation: 'Expand retrieval-baseline queries; Vectorize reindex after Scale-C',
    protocolIds: ['ironcannon/retrieval-baseline'],
    imaginationRef: 'IMG-224',
  },
  {
    id: 'EC-034',
    category: 'harvest',
    signal: 'PROVIDER_DOMINANCE_STRIPE',
    tools: ['T02'],
    mitigation: 'harvest:scale-c uses build-queue-balance for resend/cloudflare first',
    protocolIds: [],
    imaginationRef: 'IMG-225',
  },
  {
    id: 'EC-035',
    category: 'scale',
    signal: 'SCALE_C_GAP_REMAINING',
    tools: ['T01'],
    mitigation: 'Repeat harvest:scale-c until corpus-coverage scaleC.gap === 0',
    imaginationRef: 'IMG-226',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;

writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave41 — ${reg.edgeCaseCount} total`);
