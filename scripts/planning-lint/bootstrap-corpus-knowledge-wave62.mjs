#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['owasp', 'csrf-double-submit', 'Use synchronizer token pattern; validate Origin/Referer on state-changing requests'],
  ['owasp', 'session-fixation', 'Call session.regenerate() after login; invalidate old session id'],
  ['owasp', 'password-work-factor', 'bcrypt cost >= 10 or argon2id with memory limits; never SHA1 for passwords'],
  ['stripe', 'webhook-timeout', 'Stripe webhook handlers must respond within 20s; defer heavy work to queue'],
  ['stripe', 'customer-metadata', 'Store internal user id in Stripe Customer metadata for reconciliation'],
  ['stripe', 'invoice-finalized', 'Listen invoice.finalized for accounting; do not rely on checkout alone'],
  ['cloudflare', 'waf-logpush', 'Enable WAF Logpush for security monitoring on production zones'],
  ['cloudflare', 'do-storage-limit', 'Durable Object SQLite has size limits; archive cold rows to R2'],
  ['cloudflare', 'workers-tail', 'Use wrangler tail + observability for staging webhook debugging'],
  ['resend', 'reply-to-header', 'Set Reply-To separately from From for support workflows'],
  ['resend', 'idempotency-key', 'Send idempotency key on Resend API calls from Workers to prevent duplicate sends'],
  ['nextjs', 'server-only-env', 'Use server-only package for modules that import secrets'],
  ['legal', 'legitimate-interest', 'Document LIA when relying on legitimate interest for analytics'],
  ['ironcannon', 't12-markets-first', 'Call map_compliance_obligations with primaryMarkets before T13 per obligation'],
  ['ironcannon', 'armor-before-ship', 'Run audit_production_readiness with confirmedChecklistIds before deploy'],
];

mkdirSync(REF, { recursive: true });
let added = 0;
const existingRef = new Set();
for (const f of readdirSync(REF)) {
  if (!f.endsWith('.specimen.json')) continue;
  const c = JSON.parse(readFileSync(join(REF, f), 'utf8'));
  if (c.refId) existingRef.add(c.refId);
}

for (const [provider, slug, excerpt] of MICRO) {
  const refId = `${provider}/knowledge-w62-${slug}`;
  if (existingRef.has(refId)) continue;
  writeFileSync(
    join(REF, `${provider}-knowledge-w62-${slug}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w62/${slug}`,
        lastVerified: '2026-06-06',
        title: `W62 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave62`,
        tags: ['wave62', 'knowledge', provider],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}
console.log(`✓ Knowledge wave62 corpus — ${added} micro cards added`);
