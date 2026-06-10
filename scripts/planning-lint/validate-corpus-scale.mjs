#!/usr/bin/env node
/** Tiered corpus scale gates (not Gate 1) — --tier=a|b|c */
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const tier = process.argv.find((a) => a.startsWith('--tier='))?.split('=')[1] ?? 'a';
const TARGETS = { a: 500, b: 1000, c1: 1500, c2: 2000, c: 3000, d: 10000 };
const target = TARGETS[tier];
if (!target) {
  console.error('Usage: validate-corpus-scale.mjs --tier=a|b|c1|c2|c|d');
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const count = readdirSync(join(ROOT, 'docs/engine/specimens/references')).filter((f) =>
  f.endsWith('.specimen.json'),
).length;

if (count < target) {
  console.error(`Corpus scale-${tier}: ${count}/${target} — not met (planning gate only)`);
  process.exit(1);
}
console.log(`✓ Corpus scale-${tier} — ${count}/${target}`);
process.exit(0);
