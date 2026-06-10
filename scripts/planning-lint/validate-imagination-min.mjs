#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const reg = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json'), 'utf8'),
);

const MIN = 1000;
const MIN_OBLIGATION = 50;
const MIN_OBLIGATION_EVAL = 100;
const failures = [];

if (reg.scenarios.length < MIN) failures.push(`scenarios ${reg.scenarios.length} < ${MIN}`);
const ob =
  reg.scenarios.filter((s) => s.harness === 'obligation' || s.harness === 'obligation-eval').length;
const obEval = reg.scenarios.filter((s) => s.harness === 'obligation-eval').length;
if (ob < MIN_OBLIGATION) failures.push(`obligation scenarios ${ob} < ${MIN_OBLIGATION}`);
if (obEval < MIN_OBLIGATION_EVAL) failures.push(`obligation-eval ${obEval} < ${MIN_OBLIGATION_EVAL}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `✓ Imagination registry — ${reg.scenarios.length} scenarios (${ob} obligation, ${obEval} eval)`,
);
process.exit(0);
