#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const added = [
  {
    id: 'EC-036',
    category: 'vectorize',
    signal: 'VECTORIZE_STALE_AFTER_HARVEST',
    tools: ['T04'],
    mitigation: 'Run vectorize-reindex.mjs after each Scale-C batch when CF creds set',
    protocolIds: ['ironcannon/retrieval-baseline'],
    imaginationRef: 'IMG-230',
  },
  {
    id: 'EC-037',
    category: 'corpus',
    signal: 'CORPUS_PROVIDER_SKEW_CLOUDFLARE',
    tools: ['T02'],
    mitigation: 'Alternate harvest:scale-c with stripe-owasp-boost queue merge',
    imaginationRef: 'IMG-231',
  },
  {
    id: 'EC-038',
    category: 'legal',
    signal: 'MULTI_MARKET_COMPOSE_OVERLAP',
    tools: ['T12', 'T13'],
    mitigation: 'Filter EM-3 market/* touchpoints by T01 projectMarkets only',
    obligationIds: ['LEG-PRIV-001'],
    markets: ['eu', 'us'],
  },
  {
    id: 'EC-039',
    category: 'harvest',
    signal: 'HARVEST_EXCERPT_TOO_SHORT',
    tools: ['T02'],
    mitigation: 'publish-drafts skips excerpt < 80 chars; re-fetch page',
    imaginationRef: 'IMG-232',
  },
  {
    id: 'EC-040',
    category: 'planning',
    signal: 'PSYCHO_WEIGHTED_BELOW_95',
    tools: ['T01'],
    mitigation: 'Run planning:regression + lint:all after each wave; fix retrieval calibration',
    imaginationRef: 'IMG-233',
  },
];

const existing = new Set(reg.edgeCases.map((e) => e.id));
for (const ec of added) {
  if (!existing.has(ec.id)) reg.edgeCases.push(ec);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave42 — ${reg.edgeCaseCount} total`);
