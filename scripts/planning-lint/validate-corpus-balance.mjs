#!/usr/bin/env node
/** Warn if one provider dominates corpus (quality gate, not Scale-A count) */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');
const MAX_SHARE = 0.65;

const byProvider = {};
let total = 0;
for (const f of readdirSync(REF)) {
  if (!f.endsWith('.specimen.json')) continue;
  const c = JSON.parse(readFileSync(join(REF, f), 'utf8'));
  const p = c.refId?.split('/')[0] ?? 'unknown';
  byProvider[p] = (byProvider[p] ?? 0) + 1;
  total += 1;
}

const failures = [];
for (const [p, n] of Object.entries(byProvider)) {
  const share = n / total;
  if (share > MAX_SHARE) failures.push(`${p} ${(share * 100).toFixed(1)}% > ${MAX_SHARE * 100}%`);
}

if (failures.length) {
  console.error('Corpus balance warnings:');
  failures.forEach((f) => console.error(`  ⚠ ${f}`));
  process.exit(1);
}
console.log(`✓ Corpus balance — ${total} cards, no provider > ${MAX_SHARE * 100}%`);
for (const [p, n] of Object.entries(byProvider).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${p}: ${n}`);
}
process.exit(0);
