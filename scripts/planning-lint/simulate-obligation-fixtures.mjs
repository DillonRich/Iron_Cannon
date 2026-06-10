#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { evaluateCompare } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');
const IDX = JSON.parse(readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'));

const failures = [];
let ok = 0;

if (!readdirSync(join(ROOT, 'docs/engine/specimens/fixtures/compliance')).includes('obligations')) {
  console.error('Run bootstrap-r13-corpus-l4.mjs first');
  process.exit(1);
}

for (const ob of IDX.obligations) {
  const path = join(DIR, `${ob.id}.fixture-spec.json`);
  if (!existsSync(path)) {
    failures.push(`${ob.id}: missing fixture`);
    continue;
  }
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  const pass = evaluateCompare(spec.detectType, spec.passSnippet, spec.detect ?? {});
  const fail = evaluateCompare(spec.detectType, spec.failSnippet, spec.detect ?? {});
  if (pass !== spec.expectedPass || fail !== spec.expectedFail) {
    failures.push(`${ob.id}: pass ${pass}/${spec.expectedPass} fail ${fail}/${spec.expectedFail}`);
  } else {
    ok++;
  }
}

const rate = ok / IDX.obligations.length;
if (rate < 0.9) failures.push(`obligation fixture pass rate ${(rate * 100).toFixed(1)}% < 90%`);

if (failures.length) {
  console.error(failures.slice(0, 20).join('\n'));
  process.exit(1);
}
console.log(`✓ Obligation fixtures — ${ok}/${IDX.obligations.length} (${Math.round(rate * 100)}%)`);
process.exit(0);
