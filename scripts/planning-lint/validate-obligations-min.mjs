#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MIN = Number(process.env.OBLIGATION_MIN ?? 100);
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const failures = [];
if (idx.obligations.length < MIN) {
  failures.push(`obligations ${idx.obligations.length} < ${MIN}`);
}
const fixDir = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');
let missingFix = 0;
for (const ob of idx.obligations) {
  if (!existsSync(join(fixDir, `${ob.id}.fixture-spec.json`))) missingFix += 1;
}
if (missingFix > 0) failures.push(`${missingFix} obligations missing fixtures`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Obligations — ${idx.obligations.length} (min ${MIN}), fixtures complete`);
process.exit(0);
