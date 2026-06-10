#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-066',
    category: 'em1',
    signal: 'EM1_LATTICE_UNDER_1800',
    tools: ['T05'],
    mitigation: 'expand-em1-lattice-1800 + build-em2 + build-em3',
    imaginationRef: 'IMG-296',
  },
  {
    id: 'EC-067',
    category: 'legal',
    signal: 'JURISDICTION_MARKET_UNDER_40',
    tools: ['T04'],
    mitigation: 'expand-jurisdiction-bundles-wave52',
    imaginationRef: 'IMG-297',
  },
  {
    id: 'EC-068',
    category: 'retrieval',
    signal: 'RETRIEVAL_BASELINE_60_QUERIES',
    tools: ['T04'],
    mitigation: 'expand-retrieval-baseline-wave52 + calibrate-retrieval-baseline',
    imaginationRef: 'IMG-298',
  },
  {
    id: 'EC-069',
    category: 'security',
    signal: 'EM2_CONTROLS_STALE_AFTER_EM1_EXPAND',
    tools: ['T10'],
    mitigation: 'planning:build-em2 after every EM-1 lattice expansion',
    imaginationRef: 'IMG-299',
  },
  {
    id: 'EC-070',
    category: 'armor',
    signal: 'ARMOR_PATTERN_MISSING_ON_A01_A03',
    tools: ['T09'],
    mitigation: 'expand-compliance-patterns-wave52 on A01-A03 fixtures',
    imaginationRef: 'IMG-300',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 52 — ${reg.edgeCaseCount} total`);
