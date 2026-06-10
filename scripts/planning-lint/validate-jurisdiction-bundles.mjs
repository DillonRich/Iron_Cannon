#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const bundles = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json'), 'utf8'),
);

const MIN_MARKETS = 50;
const failures = [];

if ((bundles.markets?.length ?? 0) < MIN_MARKETS) {
  failures.push(`need ≥${MIN_MARKETS} markets, got ${bundles.markets?.length}`);
}

for (const m of bundles.markets ?? []) {
  if (!m.obligationPatterns?.length) failures.push(`${m.marketId} missing obligationPatterns`);
  if (!m.microStipulations?.length) failures.push(`${m.marketId} missing microStipulations`);
}

if (!bundles.disclaimerRef) failures.push('missing disclaimerRef');

if (failures.length) {
  console.error('Jurisdiction bundle failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Jurisdiction legal bundles — ${bundles.markets.length} markets`);
process.exit(0);
