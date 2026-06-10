#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-061',
    category: 'em1',
    signal: 'EM1_LATTICE_UNDER_1500',
    tools: ['T05'],
    mitigation: 'expand-em1-lattice-1500 + build-em2 + build-em3',
    imaginationRef: 'IMG-285',
  },
  {
    id: 'EC-062',
    category: 'legal',
    signal: 'JURISDICTION_MARKET_UNDER_35',
    tools: ['T04'],
    mitigation: 'expand-jurisdiction-bundles-wave51',
    imaginationRef: 'IMG-286',
  },
  {
    id: 'EC-063',
    category: 'retrieval',
    signal: 'RETRIEVAL_BASELINE_55_QUERIES',
    tools: ['T04'],
    mitigation: 'expand-retrieval-baseline-wave51 + calibrate-retrieval-baseline',
    imaginationRef: 'IMG-287',
  },
  {
    id: 'EC-064',
    category: 'security',
    signal: 'SECURITY_PROTOCOL_UNDER_400',
    tools: ['T10'],
    mitigation: 'expand-security-protocol-registry-wave51 + activate-security-protocols',
    imaginationRef: 'IMG-288',
  },
  {
    id: 'EC-065',
    category: 'cloudflare',
    signal: 'VECTORIZE_MANIFEST_STALE_POST_W51_CARDS',
    tools: ['T04'],
    mitigation: 'npm run harvest:vectorize-manifest (export only; CF API on hold)',
    imaginationRef: 'IMG-289',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 51 — ${reg.edgeCaseCount} total`);
