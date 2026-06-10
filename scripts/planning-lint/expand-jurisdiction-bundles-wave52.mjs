#!/usr/bin/env node
/** Expand jurisdiction-legal-bundles to 40 markets */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json');
const bundles = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(bundles.markets.map((m) => m.marketId));

const NEW_MARKETS = [
  { marketId: 'gr', label: 'Greece', regions: ['GR'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'cz', label: 'Czech Republic', regions: ['CZ'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'ro', label: 'Romania', regions: ['RO'], patterns: ['LEG-PRIV-*', 'LEG-TERMS-*'] },
  { marketId: 'hu', label: 'Hungary', regions: ['HU'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'lt', label: 'Lithuania', regions: ['LT'], patterns: ['LEG-PRIV-*', 'LEG-EMAIL-*'] },
];

for (const m of NEW_MARKETS) {
  if (existing.has(m.marketId)) continue;
  bundles.markets.push({
    marketId: m.marketId,
    label: m.label,
    regions: m.regions,
    obligationPatterns: m.patterns,
    microStipulations: [
      {
        id: `${m.marketId.toUpperCase()}-PRIV-NOTICE`,
        summary: `Privacy notice meets ${m.label} baseline before charge`,
        detectRef: 'LEG-PRIV-001',
      },
      {
        id: `${m.marketId.toUpperCase()}-COOKIE-CONSENT`,
        summary: 'Cookie consent aligned with regional ePrivacy expectations',
        detectRef: 'LEG-COOKIE-001',
      },
      {
        id: `${m.marketId.toUpperCase()}-EMAIL-TRANSACTIONAL`,
        summary: 'Transactional email only on verified domain',
        detectRef: 'LEG-EMAIL-001',
      },
    ],
  });
}

bundles.marketCount = bundles.markets.length;
writeFileSync(path, JSON.stringify(bundles, null, 2) + '\n');
console.log(`✓ Jurisdiction bundles wave 52 — ${bundles.marketCount} markets`);
