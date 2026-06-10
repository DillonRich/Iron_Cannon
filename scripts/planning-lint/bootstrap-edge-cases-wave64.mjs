#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.edgeCases.map((c) => c.id));
const added = [
  { id: 'EC-086', category: 'stripe', signal: 'STRIPE_WEBHOOK_UNSIGNED', tools: ['T05'], mitigation: 'expand-em1-stripe-cf-links-wave64', imaginationRef: 'IMG-1151' },
  { id: 'EC-087', category: 'cloudflare', signal: 'TURNSTILE_MISSING_ON_AUTH', tools: ['T10'], mitigation: 'bootstrap-corpus-knowledge-wave64', imaginationRef: 'IMG-1152' },
  { id: 'EC-088', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_UNDER_120', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave64', imaginationRef: 'IMG-1153' },
  { id: 'EC-089', category: 'legal', signal: 'GDPR_PORTABILITY_ROUTE_MISSING', tools: ['T12'], mitigation: 'bootstrap-obligations-wave64', imaginationRef: 'IMG-1154' },
  { id: 'EC-090', category: 'ironclad', signal: 'OBLIGATION_UNDER_150', tools: ['T12'], mitigation: 'bootstrap-obligations-wave64', imaginationRef: 'IMG-1155' },
];
for (const c of added) {
  if (!existing.has(c.id)) reg.edgeCases.push(c);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 64 — ${reg.edgeCaseCount} cases`);
