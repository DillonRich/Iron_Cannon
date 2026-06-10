#!/usr/bin/env node
/** RB-21..RB-30 — rank-calibrated against live index */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/reference-index.specimen.json'), 'utf8'),
);
const path = join(ROOT, 'docs/engine/planning/retrieval-baseline-queries.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

function tokens(s) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function expectedForQuery(query) {
  const qt = tokens(query);
  const ranked = [...INDEX.entries]
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
    .sort((a, b) => b.s - a.s);
  return ranked.slice(0, 3).map((r) => r.refId);
}

const newQueries = [
  { id: 'RB-21', query: 'cloudflare workers durable objects sqlite alarm websocket' },
  { id: 'RB-22', query: 'cloudflare turnstile bot management captcha' },
  { id: 'RB-23', query: 'stripe subscription schedule proration billing portal' },
  { id: 'RB-24', query: 'stripe tax calculation automatic tax compliance' },
  { id: 'RB-25', query: 'resend batch email rate limit api key scopes' },
  { id: 'RB-26', query: 'nextjs server actions security csrf mutation' },
  { id: 'RB-27', query: 'OWASP logging monitoring cheat sheet security events' },
  { id: 'RB-28', query: 'OWASP XSS prevention output encoding context' },
  { id: 'RB-29', query: 'cookie consent banner GDPR ePrivacy legitimate interest' },
  { id: 'RB-30', query: 'iron cannon scheduled regression psycho scorecard' },
];

const byId = new Map(reg.queries.map((q) => [q.id, q]));
for (const nq of newQueries) {
  const expectedRefIds = expectedForQuery(nq.query);
  if (!expectedRefIds.length) continue;
  byId.set(nq.id, { id: nq.id, query: nq.query, expectedRefIds });
}

reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.passThreshold = 0.9;
reg.description = `Planning baseline at ${INDEX.cardCount ?? INDEX.entries?.length} cards`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval baseline — ${reg.queryCount} queries`);
