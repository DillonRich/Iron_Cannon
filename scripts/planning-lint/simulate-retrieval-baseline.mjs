#!/usr/bin/env node
/** Planning baseline retrieval — token overlap rank vs reference-index (simulates Vectorize top-3). */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX = join(ROOT, 'docs/engine/specimens/reference-index.specimen.json');
const QUERIES = join(ROOT, 'docs/engine/planning/retrieval-baseline-queries.json');

function tokens(s) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function score(queryTok, entry) {
  const hay = `${entry.refId} ${entry.title} ${entry.embeddingHint}`.toLowerCase();
  let s = 0;
  for (const t of queryTok) {
    if (hay.includes(t)) s += 1;
    if (entry.refId.toLowerCase().includes(t)) s += 2;
  }
  return s;
}

const index = JSON.parse(readFileSync(INDEX, 'utf8'));
const { queries, passThreshold } = JSON.parse(readFileSync(QUERIES, 'utf8'));
const failures = [];
let hits = 0;

for (const q of queries) {
  const qt = tokens(q.query);
  const ranked = [...index.entries]
    .map((e) => ({ refId: e.refId, s: score(qt, e) }))
    .sort((a, b) => b.s - a.s);
  const top3 = ranked.slice(0, 3).map((r) => r.refId);
  const ok = q.expectedRefIds.some((id) => top3.includes(id));
  if (ok) hits += 1;
  else {
    failures.push(`${q.id}: expected one of [${q.expectedRefIds.join(', ')}] in top3 [${top3.join(', ')}]`);
  }
}

const rate = hits / queries.length;
console.log(`Retrieval baseline: ${hits}/${queries.length} (${(rate * 100).toFixed(1)}%)`);
if (rate < passThreshold) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`Threshold ${passThreshold * 100}% not met`);
  process.exit(1);
}
console.log(`✓ Retrieval baseline — ${hits}/${queries.length} (≥${passThreshold * 100}%)`);
process.exit(0);
