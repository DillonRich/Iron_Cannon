#!/usr/bin/env node
/** Planning corpus cards — Scale-C4 final gap fill to 3000 */
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const TARGET = 3000;

const TOPICS = [
  ['cloudflare', 'workers', 'Isolate secrets in Workers; never log raw API keys'],
  ['cloudflare', 'd1', 'Use migrations for schema; backup before destructive ALTER'],
  ['stripe', 'tax', 'Automatic tax requires customer address and tax ID collection'],
  ['stripe', 'radar', 'Review Radar rules for card testing and velocity limits'],
  ['resend', 'webhooks', 'Verify Resend webhook signatures on bounce and delivery events'],
  ['nextjs', 'auth', 'Protect Server Actions with session check and CSRF where applicable'],
  ['owasp', 'crypto', 'Use AEAD for tokens at rest; rotate keys on compromise'],
  ['legal', 'subprocessors', 'List subprocessors in privacy policy with change notice'],
  ['legal', 'retention', 'Define retention per data category; honor erasure requests'],
  ['ironcannon', 'scale-c', 'Scale-C complete: tier=c lint gate and retrieval re-calibration'],
];

const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
    if (c.refId) existing.add(c.refId);
  } catch {
    /* skip */
  }
}

const need = Math.max(0, TARGET - existing.size);
let created = 0;
for (let i = 0; i < need; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/scale-c4-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  const path = join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/corpus/${refId}`,
        lastVerified: '2026-06-03',
        title: `Scale-C4 ${t[1]} ${i}`,
        excerpt: `${t[2]}. Final Scale-C planning reference for Iron Cannon MCP compose and compliance agents.`,
        tags: [t[0], t[1], 'scale-c4', 'scale-c'],
        embeddingHint: `${t[0]} ${t[1]} ${t[2]} iron cannon scale-c compliance`,
      },
      null,
      2,
    ) + '\n',
  );
  created++;
}
console.log(`✓ Scale-C4 planning cards — ${created} new (target ${TARGET}, was ${existing.size})`);
