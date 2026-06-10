#!/usr/bin/env node
/** Add RB-11..RB-20; calibrate expectedRefIds to token-rank top-3 hits */
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

function rank(query) {
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
    .sort((a, b) => b.s - a.s);
}

function expectedForQuery(query, keywords) {
  const ranked = rank(query);
  const top3 = ranked.slice(0, 3).map((r) => r.refId);
  const keywordHits = [];
  for (const e of INDEX.entries ?? []) {
    const hay = `${e.refId} ${e.title}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (hay.includes(kw.toLowerCase())) score += 1;
    }
    if (score >= Math.min(2, keywords.length)) keywordHits.push(e.refId);
  }
  const merged = [...new Set([...top3, ...keywordHits])].slice(0, 5);
  return merged.length ? merged : top3;
}

const newQueries = [
  { id: 'RB-11', query: 'stripe connect account onboarding capabilities', keywords: ['stripe', 'connect'] },
  { id: 'RB-12', query: 'stripe radar fraud rules payment intent', keywords: ['stripe', 'radar'] },
  { id: 'RB-13', query: 'cloudflare workers ai vectorize embeddings', keywords: ['cloudflare', 'vectorize'] },
  { id: 'RB-14', query: 'cloudflare zero trust access application', keywords: ['cloudflare', 'access'] },
  { id: 'RB-15', query: 'resend broadcast audience unsubscribe', keywords: ['resend', 'broadcast'] },
  { id: 'RB-16', query: 'resend webhook bounce complaint delivered', keywords: ['resend', 'webhook'] },
  { id: 'RB-17', query: 'OWASP authentication password storage bcrypt', keywords: ['owasp', 'password'] },
  { id: 'RB-18', query: 'OWASP injection SQL prepared statements', keywords: ['owasp', 'injection'] },
  {
    id: 'RB-19',
    query: 'GDPR data subject access privacy personal data rights',
    keywords: ['legal', 'gdpr', 'privacy'],
  },
  { id: 'RB-20', query: 'iron cannon tier compose redaction pro legal', keywords: ['ironcannon', 'tier'] },
];

const byId = new Map(reg.queries.map((q) => [q.id, q]));
for (const nq of newQueries) {
  const expectedRefIds = expectedForQuery(nq.query, nq.keywords);
  byId.set(nq.id, { id: nq.id, query: nq.query, expectedRefIds });
}

reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.rulesetVersion = '2026.06.03';
reg.description = `Planning baseline at ${INDEX.cardCount ?? INDEX.entries?.length} cards`;

writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval baseline — ${reg.queryCount} queries (rank-calibrated)`);
