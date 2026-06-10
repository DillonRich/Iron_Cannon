#!/usr/bin/env node
/** Quality gate — share of P0 provider cards sourced from live vendor URLs */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const HOSTS = {
  stripe: 'stripe.com',
  cloudflare: 'developers.cloudflare.com',
  resend: 'resend.com',
  nextjs: 'nextjs.org',
  owasp: 'owasp.org',
};

const MIN_HARVESTED_SHARE = { stripe: 0.12, cloudflare: 0.12, resend: 0.12, nextjs: 0.12, owasp: 0.03 };

const stats = Object.fromEntries(Object.keys(HOSTS).map((k) => [k, { total: 0, harvested: 0 }]));
let total = 0;

for (const f of readdirSync(REF)) {
  if (!f.endsWith('.specimen.json')) continue;
  total += 1;
  const c = JSON.parse(readFileSync(join(REF, f), 'utf8'));
  const provider = (c.refId ?? '').split('/')[0];
  const host = HOSTS[provider];
  if (!host) continue;
  stats[provider].total += 1;
  if ((c.sourceUrl ?? '').includes(host)) stats[provider].harvested += 1;
}

const failures = [];
const report = [];
for (const [provider, s] of Object.entries(stats)) {
  const share = s.total ? s.harvested / s.total : 0;
  report.push(`${provider}: ${s.harvested}/${s.total} harvested (${(share * 100).toFixed(1)}%)`);
  const minShare = MIN_HARVESTED_SHARE[provider] ?? 0.12;
  if (share < minShare && s.total >= 100) {
    failures.push(`${provider}: harvested share ${(share * 100).toFixed(1)}% < ${minShare * 100}%`);
  }
}

if (failures.length) {
  console.error('Corpus harvest quality:\n' + failures.join('\n'));
  console.error(report.join('\n'));
  process.exit(1);
}
console.log(`✓ Corpus harvest quality — ${total} cards`);
report.forEach((r) => console.log(`    ${r}`));
process.exit(0);
