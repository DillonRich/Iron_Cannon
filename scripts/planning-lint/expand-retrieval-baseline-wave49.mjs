#!/usr/bin/env node
/** RB-31..RB-40 + calibrate all queries (10k corpus) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/reference-index.specimen.json'), 'utf8'),
);
const path = join(ROOT, 'docs/engine/planning/retrieval-baseline-queries.json');

function tokens(s) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function topRefsForQuery(query, n = 3) {
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
  return ranked.slice(0, n).map((r) => r.refId);
}

const reg = JSON.parse(readFileSync(path, 'utf8'));
const newQueries = [
  { id: 'RB-31', query: 'iron cannon tier entitlement compose redaction pro armor' },
  { id: 'RB-32', query: 'scale-d corpus planning reference card compliance agent' },
  { id: 'RB-33', query: 'jurisdiction market bundle GDPR micro stipulation' },
  { id: 'RB-34', query: 'EM-2 security control matrix flow step protocol' },
  { id: 'RB-35', query: 'password reset token single use expiry LEG-EDGE' },
  { id: 'RB-36', query: 'data export portability TTL download link GDPR' },
  { id: 'RB-37', query: 'stripe billing portal cancel subscription proration' },
  { id: 'RB-38', query: 'resend webhook bounce complaint suppression list' },
  { id: 'RB-39', query: 'nextjs app router server component client boundary security' },
  { id: 'RB-40', query: 'OWASP insecure design threat modeling checklist' },
];

const byId = new Map(reg.queries.map((q) => [q.id, q]));
for (const nq of newQueries) {
  const expectedRefIds = topRefsForQuery(nq.query, 3);
  if (expectedRefIds.length) byId.set(nq.id, { id: nq.id, query: nq.query, expectedRefIds });
}
for (const q of byId.values()) {
  const top3 = topRefsForQuery(q.query, 3);
  if (top3.length) q.expectedRefIds = top3;
}

reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.passThreshold = 0.9;
reg.description = `Planning baseline at ${INDEX.cardCount ?? INDEX.entries?.length} cards (wave 49)`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval baseline wave 49 — ${reg.queryCount} queries`);
