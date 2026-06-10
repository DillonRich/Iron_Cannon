#!/usr/bin/env node
/** +100 ironcannon planning reference cards (retrieval diversity; Scale-D+ overflow OK) */
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const TOPICS = [
  ['ironcannon', 'em1', 'EM-1 flow step lattice RUNBOOK INCIDENT KEY_ROTATION'],
  ['ironcannon', 'em4', 'EM-4 cross-host conflict resolution CH-060 matrix drift'],
  ['ironcannon', 'retrieval', 'Retrieval baseline RB-55 calibrate top-3 token overlap'],
  ['ironcannon', 'jurisdiction', 'Jurisdiction bundle micro-stipulation market filter T01'],
  ['ironcannon', 'protocol', 'Security protocol registry sp51 active mitigation steps'],
  ['legal', 'market', 'Market-specific privacy notice before checkout charge'],
  ['stripe', 'planning', 'Stripe Connect platform controller properties planning card'],
  ['resend', 'planning', 'Resend batch idempotency key webhook retry planning'],
  ['nextjs', 'planning', 'Next.js middleware matcher auth session planning specimen'],
  ['owasp', 'planning', 'OWASP ASVS level 2 verification planning reference'],
];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
    if (c.refId) existing.add(c.refId);
  } catch {
    /* skip */
  }
}

let created = 0;
for (let i = 0; i < 100; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/planning-w51-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  const file = join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`);
  writeFileSync(
    file,
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/w51/${slug(refId)}`,
        lastVerified: '2026-06-03',
        title: `Wave51 ${t[1]} ${i}`,
        provider: t[0],
        excerpt: t[2],
        embeddingHint: t[2],
        tags: ['planning', 'wave51', t[1]],
      },
      null,
      2,
    ) + '\n',
  );
  existing.add(refId);
  created += 1;
}
console.log(`✓ Corpus planning wave 51 — +${created} cards`);
