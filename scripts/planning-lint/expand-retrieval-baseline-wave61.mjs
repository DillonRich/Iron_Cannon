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
  'stripe webhook signature constructEvent idempotency',
  'cloudflare workers d1 migrations wrangler bindings',
  'resend domain verification dkim spf dmarc',
  'nextjs app router middleware session cookies',
  'owasp csrf session fixation password reset',
  'cloudflare vectorize embeddings retrieval rag',
  'stripe checkout session success url verify server',
  'cloudflare turnstile bot protection signup',
  'resend webhook bounce complaint suppression',
  'legal gdpr data export portability deletion',
  'stripe subscription cancel portal customer',
  'cloudflare kv session attestation rate limit',
  'security csp headers armor production checklist',
  'ironclad obligation detect layer4 compare',
  'billing race shield duplicate checkout guard',
];

const reg = JSON.parse(readFileSync(path, 'utf8'));
const byId = new Map(reg.queries.map((q) => [q.id, q]));
let i = 76;
for (const topic of TOPICS) {
  const id = `RB-${i}`;
  byId.set(id, { id, query: topic, expectedRefIds: topRefsForQuery(topic, 3) });
  i += 1;
}
reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.passThreshold = 0.9;
reg.description = `Knowledge wave 61 — ${INDEX.cardCount} cards, topic-focused queries`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval wave 61 — ${reg.queryCount} queries`);
