#!/usr/bin/env node
/** G-03 exit — P0 vendor corpus depth by refId prefix + scale-D */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const P0_PROVIDERS = {
  stripe: 200,
  cloudflare: 200,
  resend: 200,
  nextjs: 200,
};

const MIN_EXCERPT = 80;
const MIN_SCALE_D = 10_000;
const MIN_DEEP_PCT = 0.85;

const stats = Object.fromEntries(Object.keys(P0_PROVIDERS).map((k) => [k, { total: 0, deep: 0 }]));
let total = 0;

for (const f of readdirSync(REF)) {
  if (!f.endsWith('.specimen.json')) continue;
  total += 1;
  const c = JSON.parse(readFileSync(join(REF, f), 'utf8'));
  const provider = (c.refId ?? '').split('/')[0];
  if (!P0_PROVIDERS[provider]) continue;
  const excerpt = (c.excerpt ?? '').trim();
  stats[provider].total += 1;
  if (excerpt.length >= MIN_EXCERPT) stats[provider].deep += 1;
}

const failures = [];
if (total < MIN_SCALE_D) failures.push(`scale-D: ${total}/${MIN_SCALE_D} cards`);
for (const [provider, minCards] of Object.entries(P0_PROVIDERS)) {
  const s = stats[provider];
  if (s.total < minCards) failures.push(`${provider}: ${s.total} cards < ${minCards}`);
  const deepPct = s.total ? s.deep / s.total : 0;
  if (deepPct < MIN_DEEP_PCT) {
    failures.push(`${provider}: deep excerpt ${(deepPct * 100).toFixed(0)}% < ${MIN_DEEP_PCT * 100}%`);
  }
}
if (!existsSync(join(ROOT, 'harvest-data/harvest-health.json'))) {
  failures.push('missing harvest-health.json — run npm run harvest:health');
}

if (failures.length) {
  console.error('Corpus depth:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Corpus depth — ${total} cards, P0 providers meet depth floor`);
for (const [p, s] of Object.entries(stats)) {
  console.log(`    ${p}: ${s.total} cards (${s.deep} deep excerpts)`);
}
process.exit(0);
