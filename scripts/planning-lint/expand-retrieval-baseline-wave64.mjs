#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX = JSON.parse(readFileSync(join(ROOT, 'docs/engine/specimens/reference-index.specimen.json'), 'utf8'));
const path = join(ROOT, 'docs/engine/planning/retrieval-baseline-queries.json');

function tokens(s) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter((t) => t.length > 2));
}
function topRefsForQuery(query, n = 3) {
  const qt = tokens(query);
  return [...INDEX.entries]
    .map((e) => {
      const hay = `${e.refId} ${e.title} ${e.embeddingHint ?? ''}`.toLowerCase();
      let s = 0;
      for (const t of qt) {
        if (hay.includes(t)) s += 1;
        if (e.refId.toLowerCase().includes(t)) s += 2;
      }
      return { refId: e.refId, s };
    })
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((r) => r.refId);
}

const TOPICS = [
  'stripe webhook signature verify endpoint secret',
  'cloudflare turnstile login form server verify',
  'cloudflare waf custom rules auth abuse block',
  'stripe radar fraud high risk payment 3ds',
  'workers rate limit binding authenticated api',
  'stripe idempotency key post mutation retry',
  'owasp logging redact pan cvv secrets',
  'gdpr data portability export json account',
  'stripe test mode keys production block',
  'cloudflare d1 migrations versioned deploy',
];

const reg = JSON.parse(readFileSync(path, 'utf8'));
const byId = new Map(reg.queries.map((q) => [q.id, q]));
let i = 111;
for (const topic of TOPICS) {
  byId.set(`RB-${i}`, { id: `RB-${i}`, query: topic, expectedRefIds: topRefsForQuery(topic, 3) });
  i += 1;
}
reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.description = `Knowledge wave 64 — ${INDEX.cardCount} cards, Stripe/CF depth`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval wave 64 — ${reg.queryCount} queries`);
