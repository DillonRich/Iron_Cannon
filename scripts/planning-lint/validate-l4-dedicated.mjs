#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const L4_DIR = join(ROOT, 'docs/engine/specimens/layer4');
const IDX = JSON.parse(readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'));
const MIN_RATE = 0.9;

let dedicated = 0;
for (const ob of IDX.obligations) {
  const f = join(L4_DIR, `obligation-${ob.id}.specimen.json`);
  if (existsSync(f)) {
    const s = JSON.parse(readFileSync(f, 'utf8'));
    if (s.content?.obligations?.includes(ob.id) && s.content?.compareSteps?.length >= 3) dedicated++;
  }
}

const rate = dedicated / IDX.obligations.length;
if (rate < MIN_RATE) {
  console.error(`L4 dedicated fragments: ${dedicated}/${IDX.obligations.length} (${(rate * 100).toFixed(1)}%) < ${MIN_RATE * 100}%`);
  process.exit(1);
}
console.log(`✓ L4 dedicated — ${dedicated}/${IDX.obligations.length} (${(rate * 100).toFixed(1)}%)`);
process.exit(0);
