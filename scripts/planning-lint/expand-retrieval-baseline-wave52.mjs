#!/usr/bin/env node
/** RB-56..RB-60 */
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
  { id: 'RB-56', query: 'EM-1 wave 52 SRE CHAOS BACKUP lattice compliance attest' },
  { id: 'RB-57', query: 'jurisdiction Greece Czech Romania Hungary Lithuania bundle' },
  { id: 'RB-58', query: 'Armor A01 A02 A03 security surface hardening pattern' },
  { id: 'RB-59', query: 'security protocol sp52 registry 450 active EM-2 rebuild' },
  { id: 'RB-60', query: 'planning w52 corpus 10200 cards retrieval baseline calibrate' },
];

const byId = new Map(reg.queries.map((q) => [q.id, q]));
for (const nq of newQueries) {
  byId.set(nq.id, { id: nq.id, query: nq.query, expectedRefIds: topRefsForQuery(nq.query, 3) });
}
for (const q of byId.values()) {
  const top3 = topRefsForQuery(q.query, 3);
  if (top3.length) q.expectedRefIds = top3;
}

reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.passThreshold = 0.9;
reg.description = `Planning baseline at ${INDEX.cardCount ?? INDEX.entries?.length} cards (wave 52)`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval baseline wave 52 — ${reg.queryCount} queries`);
