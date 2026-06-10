#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.edgeCases.map((c) => c.id));
const added = [
  { id: 'EC-096', category: 'nextjs', signal: 'MIDDLEWARE_AUTH_BYPASS', tools: ['T05'], mitigation: 'expand-em1-nextjs-owasp-links-wave66', imaginationRef: 'IMG-1251' },
  { id: 'EC-097', category: 'owasp', signal: 'XSS_UNENCODED_OUTPUT', tools: ['T10'], mitigation: 'bootstrap-obligations-wave66', imaginationRef: 'IMG-1252' },
  { id: 'EC-098', category: 'tgs', signal: 'TGS_V2_OBLIGATION_TRIGGER', tools: ['T12'], mitigation: 'record-tgs-v2-rebaseline-wave66', imaginationRef: 'IMG-1253' },
  { id: 'EC-099', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_UNDER_140', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave66', imaginationRef: 'IMG-1254' },
  { id: 'EC-100', category: 'ironclad', signal: 'OBLIGATION_UNDER_170', tools: ['T12'], mitigation: 'bootstrap-obligations-wave66', imaginationRef: 'IMG-1255' },
];
for (const c of added) {
  if (!existing.has(c.id)) reg.edgeCases.push(c);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 66 — ${reg.edgeCaseCount} cases`);
