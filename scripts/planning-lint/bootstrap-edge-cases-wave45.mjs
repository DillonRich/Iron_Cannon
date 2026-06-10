#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-041',
    category: 'corpus',
    signal: 'SCALE_C_TARGET_MET',
    tools: ['T02', 'T04'],
    mitigation: 'validate-corpus-scale --tier=c passes; re-run calibrate-retrieval-baseline',
    imaginationRef: 'IMG-246',
  },
  {
    id: 'EC-042',
    category: 'harvest',
    signal: 'HARVEST_QUEUE_EXHAUSTED_VENDOR',
    tools: ['T02'],
    mitigation: 'Use planning bootstrap cards; refresh llms.txt sync monthly',
    imaginationRef: 'IMG-247',
  },
  {
    id: 'EC-043',
    category: 'compose',
    signal: 'COMPOSE_SLICE_DOMINANCE_PLANNING_CARDS',
    tools: ['T04'],
    mitigation: 'Balance scale-c4 topics across providers; validate-corpus-balance',
    imaginationRef: 'IMG-248',
  },
  {
    id: 'EC-044',
    category: 'retrieval',
    signal: 'RETRIEVAL_CALIBRATION_REQUIRED_POST_SCALE_C',
    tools: ['T04'],
    mitigation: 'Run calibrate-retrieval-baseline.mjs after every index rebuild',
    protocolIds: ['ironcannon/retrieval-baseline'],
    imaginationRef: 'IMG-249',
  },
  {
    id: 'EC-045',
    category: 'planning',
    signal: 'TIER_C_LINT_NOT_PROMOTED',
    tools: ['T01'],
    mitigation: 'Add validate-corpus-scale --tier=c to lint:planning when count ≥ 3000',
    imaginationRef: 'IMG-250',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 45 — ${reg.edgeCaseCount} total`);
