#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['stripe', 'webhook-signature-verify', 'Verify Stripe-Signature header with endpoint secret before parsing events'],
  ['stripe', 'radar-high-risk-3ds', 'Enable Radar rules and 3DS for high-risk PaymentIntents per fraud settings'],
  ['cloudflare', 'turnstile-login-gate', 'Add Turnstile widget to login/signup; verify token server-side before session issue'],
  ['cloudflare', 'waf-auth-rate-limit', 'Combine WAF custom rules with Workers rate limit bindings on auth API routes'],
  ['cloudflare', 'd1-migration-ci', 'Run D1 migrations in CI before deploy; never mutate prod schema manually'],
  ['legal', 'gdpr-portability-json', 'Provide machine-readable JSON export for GDPR Article 20 portability requests'],
  ['legal', 'ccpa-opt-out-signal', 'Honor Global Privacy Control and Do Not Sell signals for California users'],
  ['owasp', 'logging-pci-redact', 'Redact PAN, CVV, and secrets from application logs per OWASP logging cheat sheet'],
  ['ironcannon', 'obligation-150-floor', 'IronClad T12 filters obligations using primaryMarkets; index floor 150+'],
  ['resend', 'bounce-complaint-webhook', 'Process Resend bounce/complaint webhooks to sync suppression list'],
];

mkdirSync(REF, { recursive: true });
const existingRef = new Set();
for (const f of readdirSync(REF)) {
  if (!f.endsWith('.specimen.json')) continue;
  const c = JSON.parse(readFileSync(join(REF, f), 'utf8'));
  if (c.refId) existingRef.add(c.refId);
}

let added = 0;
for (const [provider, slug, excerpt] of MICRO) {
  const refId = `${provider}/knowledge-w64-${slug}`;
  if (existingRef.has(refId)) continue;
  writeFileSync(
    join(REF, `${provider}-knowledge-w64-${slug}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w64/${slug}`,
        lastVerified: '2026-06-06',
        title: `W64 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave64 legal security`,
        tags: ['wave64', 'knowledge', provider],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}
console.log(`✓ Knowledge wave64 corpus — ${added} micro cards added`);
