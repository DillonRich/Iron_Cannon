#!/usr/bin/env node
/** High-quality micro reference cards — config/security/legal depth (wave 61) */
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['stripe', 'webhook-tolerance', 'Stripe webhook handler must return 2xx only after idempotent side effects complete; use constructEvent with endpoint secret'],
  ['stripe', 'checkout-expiry', 'Checkout Sessions expire; never cache session.url beyond expires_at; regenerate on stale'],
  ['cloudflare', 'd1-batch-limit', 'D1 batch statements capped; split migrations into chunks under platform limits'],
  ['cloudflare', 'workers-cpu-limit', 'Long CPU work must use queues or Durable Objects; avoid sync crypto on hot path'],
  ['cloudflare', 'wrangler-secrets-rotate', 'Rotate secrets via wrangler secret put; never commit; document rotation in runbook'],
  ['resend', 'webhook-retry', 'Resend retries webhooks; handler must be idempotent on email.delivered and bounce events'],
  ['resend', 'sandbox-domain', 'Use onboarding@resend.dev only in development; production requires verified domain'],
  ['nextjs', 'middleware-matcher', 'middleware.ts matcher must exclude static assets and _next to avoid auth on images'],
  ['nextjs', 'server-action-origin', 'Server Actions require origin check; configure allowedOrigins in next.config'],
  ['owasp', 'session-regenerate', 'Regenerate session ID on privilege change login logout'],
  ['legal', 'breach-72h', 'GDPR breach notification to authority within 72 hours when risk to rights'],
  ['legal', 'ccpa-do-not-sell', 'California users need Do Not Sell link when selling personal information'],
  ['ironcannon', 'wiremap-attestation-ttl', 'wiremapAttestation expires; re-issue from T03 if session exceeds TTL'],
  ['ironcannon', 't05-before-t04-next', 'Never T04 next module until prior module T05 passes with same attestation'],
  ['stripe', 'radar-list', 'Use Radar lists to block disposable email domains at signup'],
  ['cloudflare', 'cache-api-auth', 'Never cache authenticated API responses at CDN without private directive'],
  ['resend', 'batch-rate', 'Resend batch API has per-second limits; queue bursts in Worker'],
  ['nextjs', 'env-server-only', 'STRIPE_SECRET_KEY and webhook secrets only in server env never NEXT_PUBLIC'],
  ['owasp', 'hsts-preload', 'HSTS includeSubDomains only when all subdomains serve HTTPS'],
  ['legal', 'email-double-optin', 'Marketing lists require confirmed opt-in timestamp in EU contexts'],
];

mkdirSync(REF, { recursive: true });
let added = 0;
for (let i = 0; i < MICRO.length; i++) {
  const [provider, slug, excerpt] = MICRO[i];
  const refId = `${provider}/knowledge-w61-${slug}`;
  const fname = `${provider}-knowledge-w61-${slug}.specimen.json`;
  const fpath = join(REF, fname);
  if (existsSync(fpath)) continue;
  const dup = readdirSync(REF).find((f) => {
    try {
      return JSON.parse(readFileSync(join(REF, f), 'utf8')).refId === refId;
    } catch {
      return false;
    }
  });
  if (dup) continue;
  writeFileSync(
    fpath,
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w61/${slug}`,
        lastVerified: '2026-06-06',
        title: `W61 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave61 knowledge`,
        tags: ['wave61', 'knowledge', provider],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}
console.log(`✓ Knowledge wave61 corpus — ${added} micro cards added`);
