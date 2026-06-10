#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const edge = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'),
);
const em4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
);
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const obIds = new Set(idx.obligations.map((o) => o.id));
const chIds = new Set(em4.conflicts.map((c) => c.conflictId));

const MIN = 80;
const failures = [];

if (edge.edgeCases.length < MIN) failures.push(`edge cases ${edge.edgeCases.length} < ${MIN}`);

for (const ec of edge.edgeCases) {
  if (!ec.mitigation) failures.push(`${ec.id}: no mitigation`);
  for (const oid of ec.obligationIds ?? []) {
    if (!obIds.has(oid)) failures.push(`${ec.id}: unknown obligation ${oid}`);
  }
}

const withObligation = edge.edgeCases.filter((e) => (e.obligationIds?.length ?? 0) > 0).length;
if (withObligation < 15) failures.push(`need ≥15 edge cases with obligationIds, got ${withObligation}`);

if (em4.conflictCount < 25) failures.push(`EM-4 conflicts ${em4.conflictCount} < 25 (rebuild em4)`);

if (failures.length) {
  console.error('Edge case registry failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Edge case registry — ${edge.edgeCases.length} cases, EM-4 ${em4.conflictCount} conflicts`);
process.exit(0);
