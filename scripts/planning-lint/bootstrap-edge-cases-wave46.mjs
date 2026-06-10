#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-046',
    category: 'corpus',
    signal: 'SCALE_D_TARGET_MET',
    tools: ['T02', 'T04'],
    mitigation: 'validate-corpus-scale --tier=d; vectorize manifest refresh',
    imaginationRef: 'IMG-253',
  },
  {
    id: 'EC-047',
    category: 'extreme-map',
    signal: 'EM1_LATTICE_UNDER_800',
    tools: ['T03'],
    mitigation: 'expand-em1-lattice-800.mjs after build-em1',
    imaginationRef: 'IMG-254',
  },
  {
    id: 'EC-048',
    category: 'em4',
    signal: 'EM4_CONFLICTS_UNDER_50',
    tools: ['T01'],
    mitigation: 'append-em4-conflicts-wave46.mjs',
    imaginationRef: 'IMG-255',
  },
  {
    id: 'EC-049',
    category: 'vectorize',
    signal: 'VECTORIZE_MANIFEST_CARD_COUNT_DRIFT',
    tools: ['T04'],
    mitigation: 'harvest:vectorize-manifest after planning:build-index',
    imaginationRef: 'IMG-256',
  },
  {
    id: 'EC-050',
    category: 'compose',
    signal: 'COMPOSE_TRUNCATION_AT_10K',
    tools: ['T04'],
    mitigation: 'C14 slicer + precedence; tier-aware slice budget',
    imaginationRef: 'IMG-257',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 46 — ${reg.edgeCaseCount} total`);
