#!/usr/bin/env node
/** RB-41..RB-50 + calibrate all queries (10k corpus) */
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
  { id: 'RB-41', query: 'per-flow scope matrix security protocol registry' },
  { id: 'RB-42', query: 'agent directive template TOOL_GATE MONITOR phase' },
  { id: 'RB-43', query: 'compliance pattern density AUTH BILL module fixture' },
  { id: 'RB-44', query: 'planning quality gates regression lint session' },
  { id: 'RB-45', query: 'EM-4 cross-host conflict CH-055 unknown protocol matrix' },
  { id: 'RB-46', query: 'psycho scorecard weighted fidelity 95 percent' },
  { id: 'RB-47', query: 'harvest sync vendor queue dry planning card bootstrap' },
  { id: 'RB-48', query: 'ironclad tier L4 obligation compose slice precedence' },
  { id: 'RB-49', query: 'account deletion grace period stripe customer orphan' },
  { id: 'RB-50', query: 'terms reaccept M55 API version bump legal record' },
];

const byId = new Map(reg.queries.map((q) => [q.id, q]));
for (const nq of newQueries) {
  byId.set(nq.id, {
    id: nq.id,
    query: nq.query,
    expectedRefIds: topRefsForQuery(nq.query, 3),
  });
}
for (const q of byId.values()) {
  const top3 = topRefsForQuery(q.query, 3);
  if (top3.length) q.expectedRefIds = top3;
}

reg.queries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
reg.queryCount = reg.queries.length;
reg.passThreshold = 0.9;
reg.description = `Planning baseline at ${INDEX.cardCount ?? INDEX.entries?.length} cards (wave 50)`;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Retrieval baseline wave 50 — ${reg.queryCount} queries`);
