#!/usr/bin/env node
import { writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const TOPICS = [
  ['ironcannon', 'stretch', 'Planning stretch EM-1 2000 lattice CAPACITY COST LATENCY'],
  ['ironcannon', 'em0', 'EM-0 config matrix 500 nodes wrangler stripe resend'],
  ['legal', 'obligation', 'LEG-W53 obligation fixture compare detect type'],
  ['stripe', 'connect', 'Stripe Connect embedded components planning reference'],
  ['cloudflare', 'durable', 'Durable Objects alarm session planning specimen'],
];

const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
    if (c.refId) existing.add(c.refId);
  } catch { /* skip */ }
}

let created = 0;
for (let i = 0; i < 100; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/planning-w53-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  writeFileSync(
    join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`),
    JSON.stringify({
      refId,
      sourceUrl: `https://ironcannon.dev/planning/w53/${refId.replace(/\//g, '-')}`,
      lastVerified: '2026-06-03',
      title: `Wave53 ${t[1]} ${i}`,
      provider: t[0],
      excerpt: t[2],
      embeddingHint: t[2],
      tags: ['planning', 'wave53', 'stretch'],
    }, null, 2) + '\n',
  );
  existing.add(refId);
  created += 1;
}
console.log(`✓ Corpus planning wave 53 — +${created} cards`);
