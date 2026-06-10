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
  'owasp abuse case catalog authentication billing',
  'clickjacking x-frame-options frame-ancestors defense',
  'secure coding with ai human review gate',
  'llm prompt injection sanitize tool arguments',
  'nextjs app router authentication session',
  'stripe customer portal self service billing',
  'iron cannon agent guidance block every response',
  'adversarial agent harness g2 release gate',
  'csrf token state changing form api',
  'tier entitlement matrix mcp tools parity',
];

const reg = JSON.parse(readFileSync(path, 'utf8'));
const byId = new Map(reg.queries.map((q) => [q.id, q]));
let i = 151;
for (const topic of TOPICS) {
  byId.set(`RB-${i}`, { id: `RB-${i}`, query: topic, expectedRefIds: topRefsForQuery(topic, 3) });
  i += 1;
}
reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.description = `Knowledge wave 68 — ${INDEX.cardCount} cards, adversarial agent depth`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval wave 68 — ${reg.queryCount} queries`);
