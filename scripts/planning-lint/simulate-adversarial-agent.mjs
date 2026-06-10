#!/usr/bin/env node
/**
 * Phase 3 — adversarial agent planning harness (wave 68 scaffold).
 * Validates agent-misbehavior triggers map to documented error codes.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveError } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/adversarial-agent-scenarios.json'), 'utf8'),
);

const failures = [];
for (const s of REG.scenarios) {
  const got = resolveError(s.trigger);
  if (got !== s.expect) failures.push(`${s.id} ${s.name}: got ${got}, want ${s.expect}`);
  else console.log(`✓ ${s.id} ${s.name}`);
}

const passRate = (REG.scenarios.length - failures.length) / REG.scenarios.length;
if (failures.length || passRate < REG.minPassRate) {
  console.error(
    `Adversarial agent failures (${failures.length}/${REG.scenarios.length}):\n` + failures.join('\n'),
  );
  process.exit(1);
}

console.log(`✓ Adversarial agent harness — ${REG.scenarios.length}/${REG.scenarios.length} scenarios pass`);
process.exit(0);
