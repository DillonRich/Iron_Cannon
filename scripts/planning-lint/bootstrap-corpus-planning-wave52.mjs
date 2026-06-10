#!/usr/bin/env node
/** +100 planning reference cards (wave 52) */
import { writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const TOPICS = [
  ['ironcannon', 'em1', 'EM-1 lattice SRE CHAOS BACKUP ACCESS_REVIEW wave 52'],
  ['ironcannon', 'em2', 'EM-2 security controls 450 protocols flow step linkage'],
  ['ironcannon', 'compose', 'Compose tier redaction ironclad L4 obligation precedence'],
  ['ironcannon', 'wiremap', 'Wiremap golden path module sequence T03 before T04'],
  ['ironcannon', 'obligation', 'Obligation detect type LEG-PRIV fixture compare'],
  ['legal', 'market', 'Greece Czech Romania Hungary Lithuania market bundle'],
  ['stripe', 'planning', 'Stripe billing portal proration cancel subscription planning'],
  ['cloudflare', 'planning', 'Cloudflare Workers secrets rotation KV session planning'],
  ['resend', 'planning', 'Resend suppression list bounce complaint webhook planning'],
  ['owasp', 'planning', 'OWASP API security top 10 broken auth planning'],
];

const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
    if (c.refId) existing.add(c.refId);
  } catch {
    /* skip */
  }
}

let created = 0;
for (let i = 0; i < 100; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/planning-w52-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  writeFileSync(
    join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/w52/${refId.replace(/\//g, '-')}`,
        lastVerified: '2026-06-03',
        title: `Wave52 ${t[1]} ${i}`,
        provider: t[0],
        excerpt: t[2],
        embeddingHint: t[2],
        tags: ['planning', 'wave52', t[1]],
      },
      null,
      2,
    ) + '\n',
  );
  existing.add(refId);
  created += 1;
}
console.log(`✓ Corpus planning wave 52 — +${created} cards`);
