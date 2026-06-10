#!/usr/bin/env node
import { writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const TOPICS = [
  ['ironcannon', 'exhaust', 'Planning exhaust wave 54 retrieval 75 obligations 100'],
  ['legal', 'dsar', 'Data subject access request workflow planning card'],
  ['stripe', 'tax', 'Stripe Tax automatic calculation planning reference'],
];
const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
    if (c.refId) existing.add(c.refId);
  } catch { /* skip */ }
}
let created = 0;
for (let i = 0; i < 100; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/planning-w54-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  writeFileSync(
    join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`),
    JSON.stringify({ refId, sourceUrl: `https://ironcannon.dev/planning/w54/${i}`, lastVerified: '2026-06-03', title: `W54 ${i}`, provider: t[0], excerpt: t[2], embeddingHint: t[2], tags: ['wave54'] }, null, 2) + '\n',
  );
  existing.add(refId);
  created += 1;
}
console.log(`✓ Corpus wave 54 — +${created}`);
