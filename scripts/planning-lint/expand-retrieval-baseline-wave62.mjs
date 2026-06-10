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
  'owasp csrf prevention cheat sheet synchronizer token',
  'owasp session management regenerate id fixation',
  'owasp password storage bcrypt argon2 scrypt',
  'cloudflare waf custom rules managed rulesets',
  'cloudflare turnstile widget server side validation',
  'cloudflare durable objects alarm sqlite storage',
  'stripe idempotency key POST retry safe',
  'stripe radar fraud rules list disposable email',
  'resend batch send rate limit queue worker',
  'nextjs middleware matcher auth protected routes',
];

const reg = JSON.parse(readFileSync(path, 'utf8'));
const byId = new Map(reg.queries.map((q) => [q.id, q]));
let i = 91;
for (const topic of TOPICS) {
  byId.set(`RB-${i}`, { id: `RB-${i}`, query: topic, expectedRefIds: topRefsForQuery(topic, 3) });
  i += 1;
}
reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.description = `Knowledge wave 62 — ${INDEX.cardCount} cards`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval wave 62 — ${reg.queryCount} queries`);
