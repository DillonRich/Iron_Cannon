#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/edge-case-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(reg.edgeCases.map((c) => c.id));
const added = [
  { id: 'EC-101', category: 'mcp', signal: 'MCP_TOOL_UNAUTHORIZED', tools: ['T04'], mitigation: 'expand-em1-production-links-wave67', imaginationRef: 'IMG-1301' },
  { id: 'EC-102', category: 'rag', signal: 'RAG_CHUNK_UNVALIDATED', tools: ['T04'], mitigation: 'bootstrap-obligations-wave67', imaginationRef: 'IMG-1302' },
  { id: 'EC-103', category: 'production', signal: 'PC_HARNESS_NOT_RUN', tools: ['T11'], mitigation: 'expand-production-confidence-wave67', imaginationRef: 'IMG-1303' },
  { id: 'EC-104', category: 'retrieval', signal: 'RETRIEVAL_BASELINE_UNDER_150', tools: ['T04'], mitigation: 'expand-retrieval-baseline-wave67', imaginationRef: 'IMG-1304' },
  { id: 'EC-105', category: 'ironclad', signal: 'OBLIGATION_UNDER_180', tools: ['T12'], mitigation: 'bootstrap-obligations-wave67', imaginationRef: 'IMG-1305' },
];
for (const c of added) {
  if (!existing.has(c.id)) reg.edgeCases.push(c);
}
reg.edgeCaseCount = reg.edgeCases.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Edge cases wave 67 — ${reg.edgeCaseCount} cases`);
