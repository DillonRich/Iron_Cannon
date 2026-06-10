#!/usr/bin/env node
/** P0 vendor cards must have lastVerified; ironcannon-authored exempt */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');
const P0 = ['stripe.com', 'developers.cloudflare.com', 'resend.com', 'nextjs.org'];
const failures = [];
let checked = 0;
let missing = 0;

for (const file of readdirSync(REF)) {
  if (!file.endsWith('.specimen.json')) continue;
  const card = JSON.parse(readFileSync(join(REF, file), 'utf8'));
  const url = card.sourceUrl ?? '';
  if (!P0.some((h) => url.includes(h))) continue;
  checked += 1;
  if (!card.lastVerified) {
    missing += 1;
    if (missing <= 10) failures.push(`${card.refId}: missing lastVerified`);
  }
}

if (missing > 10) failures.push(`... and ${missing - 10} more missing lastVerified`);
if (missing > checked * 0.05) {
  failures.push(`${missing}/${checked} P0 vendor cards missing lastVerified (>5%)`);
}

if (failures.length) {
  console.error('Vendor freshness:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Vendor freshness — ${checked} P0 cards checked, all have lastVerified`);
process.exit(0);
