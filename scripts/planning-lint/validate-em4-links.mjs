#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const em4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
);
const failures = [];
const MIN_RATE = 0.85;
let linked = 0;
for (const c of em4.conflicts ?? []) {
  const ok =
    (c.protocolIds?.length ?? 0) > 0 ||
    (c.resolution?.length ?? 0) > 0 ||
    (c.mitigation?.length ?? 0) > 0;
  if (ok) linked += 1;
  else failures.push(`${c.conflictId}: no protocol/resolution/mitigation`);
}
const rate = linked / (em4.conflicts?.length || 1);
if (rate < MIN_RATE) failures.push(`link rate ${(rate * 100).toFixed(1)}% < ${MIN_RATE * 100}%`);
if (failures.length > 15) {
  console.error(`EM-4 links: ${failures.length} issues (showing 15)`);
  console.error(failures.slice(0, 15).join('\n'));
  process.exit(1);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ EM-4 links — ${linked}/${em4.conflicts.length} conflicts documented`);
process.exit(0);
