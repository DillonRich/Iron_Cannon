#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.edgeCases.map((c) => c.id));
const added = [
  { id: 'EC-081', category: 'owasp', signal: 'OWASP_CHEATSHEET_UNLINKED', tools: ['T10'], mitigation: 'expand-em1-owasp-links-wave63', imaginationRef: 'IMG-1101' },
  { id: 'EC-082', category: 'obligation', signal: 'OBLIGATION_SOURCE_REF_MISSING', tools: ['T13'], mitigation: 'bootstrap-obligation-source-ref-cards-wave63', imaginationRef: 'IMG-1102' },
  { id: 'EC-083', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_UNDER_110', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave63', imaginationRef: 'IMG-1103' },
  { id: 'EC-084', category: 'corpus', signal: 'CORPUS_UNDER_10800', tools: ['T04'], mitigation: 'harvest:owasp-cheatsheets', imaginationRef: 'IMG-1104' },
  { id: 'EC-085', category: 'ironclad', signal: 'OBLIGATION_UNDER_140', tools: ['T12'], mitigation: 'bootstrap-obligations-wave63', imaginationRef: 'IMG-1105' },
];
for (const c of added) {
  if (!existing.has(c.id)) reg.edgeCases.push(c);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 63 — ${reg.edgeCaseCount} cases`);
