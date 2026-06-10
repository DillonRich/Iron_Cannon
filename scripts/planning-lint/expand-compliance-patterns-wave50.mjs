#!/usr/bin/env node
/** Add AUTH-P50-* and BILL-P50-* to optional + lifecycle module fixtures */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MOD = join(ROOT, 'docs/engine/specimens/fixtures/modules');

const OPTIONAL = [
  'M30-onboarding-schema', 'M31-onboarding-api', 'M32-onboarding-ui',
  'M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui',
  'M50-export-api', 'M51-export-worker', 'M52-export-ui',
  'M55-terms-reaccept-api', 'M56-terms-reaccept-ui',
];

let updated = 0;
for (const f of readdirSync(MOD).filter((x) => x.endsWith('.fixture-spec.json'))) {
  const path = join(MOD, f);
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  const mid = spec.moduleId ?? f.replace('.fixture-spec.json', '');
  if (!OPTIONAL.includes(mid)) continue;
  const patterns = new Set(spec.patternsUnderTest ?? []);
  const before = patterns.size;
  if (/^M3|^M4|^M5/.test(mid)) {
    patterns.add(`AUTH-P50-${mid.slice(0, 4)}`);
    patterns.add(`AUTH-P50-LIFECYCLE`);
  }
  if (/^M1[0-6]/.test(mid)) {
    patterns.add(`BILL-P50-${mid.slice(0, 4)}`);
    patterns.add(`STWH-P50-REPLAY`);
  }
  if (patterns.size > before) {
    spec.patternsUnderTest = [...patterns];
    writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
    updated += 1;
  }
}
console.log(`✓ Compliance patterns wave 50 — ${updated} optional module fixtures updated`);
