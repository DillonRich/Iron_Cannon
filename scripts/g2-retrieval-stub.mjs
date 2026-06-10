#!/usr/bin/env node
import { retrieveRefs } from '../packages/mcp-core/src/retrieval.js';
import { readEngineJson } from '../packages/mcp-core/src/engine-data.js';

const baseline = readEngineJson('planning/retrieval-baseline-queries.json');
const failures = [];
let hits = 0;

for (const q of baseline.queries.slice(0, 20)) {
  const r = retrieveRefs(q.query, { tier: 'pro', topK: 3 });
  const top3 = r.refs.map((x) => x.refId);
  const ok = q.expectedRefIds.some((id) => top3.includes(id));
  if (ok) hits += 1;
  else failures.push(`${q.id}: got [${top3.join(', ')}]`);
}

const rate = hits / 20;
if (rate < 0.5) {
  console.error(`G-2 retrieval stub sample ${hits}/20:\n` + failures.slice(0, 5).join('\n'));
  process.exit(1);
}

const m12 = retrieveRefs('stripe webhook signature', { tier: 'pro', topK: 5 });
if (!m12.refs.length) {
  console.error('M12 retrieval empty');
  process.exit(1);
}
console.log(`✓ G-2 retrieval stub — sample ${hits}/20; M12 hits=${m12.refs.length}`);
process.exit(0);
