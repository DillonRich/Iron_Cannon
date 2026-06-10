#!/usr/bin/env node
/** Expand jurisdiction-legal-bundles to 30 markets (Phase C) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json');
const bundles = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(bundles.markets.map((m) => m.marketId));

const NEW_MARKETS = [
  { marketId: 'mx', label: 'Mexico', regions: ['MX'], patterns: ['LEG-PRIV-*', 'LEG-TERMS-*'] },
  { marketId: 'kr', label: 'South Korea', regions: ['KR'], patterns: ['LEG-PRIV-*', 'LEG-EMAIL-*'] },
  { marketId: 'ch', label: 'Switzerland', regions: ['CH'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'nz', label: 'New Zealand', regions: ['NZ'], patterns: ['LEG-PRIV-*', 'LEG-A11Y-*'] },
  { marketId: 'za', label: 'South Africa', regions: ['ZA'], patterns: ['LEG-PRIV-*', 'LEG-RECORD-*'] },
  { marketId: 'ae', label: 'United Arab Emirates', regions: ['AE'], patterns: ['LEG-PRIV-*', 'LEG-TERMS-*'] },
  { marketId: 'il', label: 'Israel', regions: ['IL'], patterns: ['LEG-PRIV-*', 'LEG-EMAIL-*'] },
  { marketId: 'tr', label: 'Turkey', regions: ['TR'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'pl', label: 'Poland', regions: ['PL'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'nl', label: 'Netherlands', regions: ['NL'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'de', label: 'Germany', regions: ['DE'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*', 'LEG-RECORD-*'] },
  { marketId: 'fr', label: 'France', regions: ['FR'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'es', label: 'Spain', regions: ['ES'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'it', label: 'Italy', regions: ['IT'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'se', label: 'Sweden', regions: ['SE'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'no', label: 'Norway', regions: ['NO'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'ie', label: 'Ireland', regions: ['IE'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'hk', label: 'Hong Kong', regions: ['HK'], patterns: ['LEG-PRIV-*', 'LEG-TERMS-*'] },
  { marketId: 'tw', label: 'Taiwan', regions: ['TW'], patterns: ['LEG-PRIV-*', 'LEG-EMAIL-*'] },
  { marketId: 'ph', label: 'Philippines', regions: ['PH'], patterns: ['LEG-PRIV-*', 'LEG-A11Y-*'] },
];

let added = 0;
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
  added += 1;
}

bundles.marketCount = bundles.markets.length;
bundles.targetPhaseC = 30;
writeFileSync(path, JSON.stringify(bundles, null, 2) + '\n');
console.log(`✓ Jurisdiction bundles — +${added} → ${bundles.marketCount} markets`);
