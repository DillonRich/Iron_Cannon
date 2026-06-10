#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.edgeCases.map((c) => c.id));
const added = [
  { id: 'EC-091', category: 'legal', signal: 'COOKIE_CONSENT_MISSING', tools: ['T12'], mitigation: 'bootstrap-obligations-wave65', imaginationRef: 'IMG-1201' },
  { id: 'EC-092', category: 'legal', signal: 'AI_DISCLOSURE_MISSING', tools: ['T12'], mitigation: 'bootstrap-missing-obligation-refs-wave65', imaginationRef: 'IMG-1202' },
  { id: 'EC-093', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_UNDER_130', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave65', imaginationRef: 'IMG-1203' },
  { id: 'EC-094', category: 'email', signal: 'RESEND_DOMAIN_UNVERIFIED', tools: ['T05'], mitigation: 'bootstrap-corpus-knowledge-wave65', imaginationRef: 'IMG-1204' },
  { id: 'EC-095', category: 'ironclad', signal: 'OBLIGATION_UNDER_160', tools: ['T12'], mitigation: 'bootstrap-obligations-wave65', imaginationRef: 'IMG-1205' },
];
for (const c of added) {
  if (!existing.has(c.id)) reg.edgeCases.push(c);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 65 — ${reg.edgeCaseCount} cases`);
