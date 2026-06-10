#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json');
const bundles = JSON.parse(readFileSync(path, 'utf8'));
const existing = new Set(bundles.markets.map((m) => m.marketId));
const NEW = [
  { marketId: 'lv', label: 'Latvia', regions: ['LV'], patterns: ['LEG-PRIV-*'] },
  { marketId: 'lu', label: 'Luxembourg', regions: ['LU'], patterns: ['LEG-PRIV-*', 'LEG-COOKIE-*'] },
  { marketId: 'mt', label: 'Malta', regions: ['MT'], patterns: ['LEG-PRIV-*'] },
  { marketId: 'cy', label: 'Cyprus', regions: ['CY'], patterns: ['LEG-PRIV-*'] },
  { marketId: 'is', label: 'Iceland', regions: ['IS'], patterns: ['LEG-PRIV-*', 'LEG-EMAIL-*'] },
];
for (const m of NEW) {
  if (existing.has(m.marketId)) continue;
  bundles.markets.push({
    marketId: m.marketId,
    label: m.label,
    regions: m.regions,
    obligationPatterns: m.patterns,
    microStipulations: [
      { id: `${m.marketId.toUpperCase()}-PRIV`, summary: `${m.label} privacy baseline`, detectRef: 'LEG-PRIV-001' },
    ],
  });
}
bundles.marketCount = bundles.markets.length;
writeFileSync(path, JSON.stringify(bundles, null, 2) + '\n');
console.log(`✓ Jurisdiction wave 54 — ${bundles.marketCount} markets`);
