#!/usr/bin/env node
/** Expand jurisdiction-legal-bundles to 35 markets */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json');
const bundles = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(bundles.markets.map((m) => m.marketId));

const NEW_MARKETS = [
  { marketId: 'at', label: 'Austria', regions: ['AT'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'be', label: 'Belgium', regions: ['BE'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'fi', label: 'Finland', regions: ['FI'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'dk', label: 'Denmark', regions: ['DK'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'pt', label: 'Portugal', regions: ['PT'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
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
console.log(`✓ Jurisdiction bundles wave 51 — ${bundles.marketCount} markets`);
