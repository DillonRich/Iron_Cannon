#!/usr/bin/env node
/** ARM-P52-* on Armor module fixtures */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MOD = join(ROOT, 'docs/engine/specimens/fixtures/modules');

const ARMOR = [
  'A01-security-surface-map',
  'A02-session-hardening-pass',
  'A03-webhook-hardening-pass',
];

let updated = 0;
for (const mid of ARMOR) {
  const path = join(MOD, `${mid}.fixture-spec.json`);
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  const patterns = new Set(spec.patternsUnderTest ?? []);
  const before = patterns.size;
  patterns.add(`ARM-P52-${mid.slice(0, 3)}`);
  patterns.add('ARM-P52-HARDENING');
  if (patterns.size > before) {
    spec.patternsUnderTest = [...patterns];
    writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
    updated += 1;
  }
}
console.log(`✓ Compliance patterns wave 52 — ${updated} Armor fixtures updated`);
