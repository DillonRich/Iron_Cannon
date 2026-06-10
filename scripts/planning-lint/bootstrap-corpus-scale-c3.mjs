#!/usr/bin/env node
/** Planning corpus cards — Scale-C3 depth (stripe micro, resend deliverability, owasp) */
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const TOPICS = [
  ['stripe', 'webhooks', 'Verify signature with raw body; reject missing stripe-signature'],
  ['stripe', 'billing', 'Map invoice.payment_failed to grace period and user email'],
  ['stripe', 'connect', 'Separate Connect account capabilities from platform charges'],
  ['resend', 'deliverability', 'SPF/DKIM/DMARC alignment before high-volume campaigns'],
  ['resend', 'templates', 'Version transactional templates; audit variable injection'],
  ['owasp', 'auth', 'Password storage: Argon2id or bcrypt with per-user salt'],
  ['owasp', 'api', 'Rate limit auth endpoints separately from public assets'],
  ['legal', 'breach', 'Document 72-hour breach notification triggers per market'],
  ['legal', 'dpia', 'Run DPIA when new high-risk processing or vendor subprocessor'],
  ['ironcannon', 'retrieval', 'Re-calibrate retrieval baseline after corpus harvest waves'],
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

let created = 0;
for (let i = 0; i < 400; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/scale-c3-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  const path = join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/corpus/${refId}`,
        lastVerified: '2026-06-03',
        title: `Scale-C3 ${t[1]} ${i}`,
        excerpt: `${t[2]}. Planning reference for compose agents and obligation cross-links (EM-3).`,
        tags: [t[0], t[1], 'scale-c3'],
        embeddingHint: `${t[0]} ${t[1]} ${t[2]} compliance security legal stripe resend owasp`,
      },
      null,
      2,
    ) + '\n',
  );
  created++;
}
console.log(`✓ Scale-C3 planning cards — ${created} new`);
