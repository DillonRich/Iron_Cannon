#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json');
const bundles = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(bundles.markets.map((m) => m.marketId));

const NEW = [
  { marketId: 'sk', label: 'Slovakia', regions: ['SK'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'si', label: 'Slovenia', regions: ['SI'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'bg', label: 'Bulgaria', regions: ['BG'], patterns: ['LEG-PRIV-*', 'LEG-TERMS-*'] },
  { marketId: 'hr', label: 'Croatia', regions: ['HR'], patterns: ['LEG-PRIV-*', 'LEG-EMAIL-*'] },
  { marketId: 'ee', label: 'Estonia', regions: ['EE'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
];

for (const m of NEW) {
  if (existing.has(m.marketId)) continue;
  bundles.markets.push({
    marketId: m.marketId,
    label: m.label,
    regions: m.regions,
    obligationPatterns: m.patterns,
    microStipulations: [
      { id: `${m.marketId.toUpperCase()}-PRIV-NOTICE`, summary: `Privacy notice meets ${m.label} baseline`, detectRef: 'LEG-PRIV-001' },
      { id: `${m.marketId.toUpperCase()}-COOKIE-CONSENT`, summary: 'Cookie consent per ePrivacy', detectRef: 'LEG-COOKIE-001' },
      { id: `${m.marketId.toUpperCase()}-EMAIL-TRANSACTIONAL`, summary: 'Verified sender domain', detectRef: 'LEG-EMAIL-001' },
    ],
  });
}
bundles.marketCount = bundles.markets.length;
writeFileSync(path, JSON.stringify(bundles, null, 2) + '\n');
console.log(`✓ Jurisdiction wave 53 — ${bundles.marketCount} markets`);
