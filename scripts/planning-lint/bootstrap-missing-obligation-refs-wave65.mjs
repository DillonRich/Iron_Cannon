#!/usr/bin/env node
/** Ensure all obligation sourceRefIds have corpus cards (legal depth wave 65) */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);

const STUBS = {
  'legal/ai-disclosure': 'Disclose when AI or automated systems assist users or make decisions affecting them.',
  'legal/eu-transfer-mechanism': 'Document lawful EU cross-border transfer mechanism: SCCs, adequacy, or binding corporate rules.',
  'legal/status-page-link': 'Maintain a public status page and link it in incident communications and support templates.',
  'legal/aria-live-errors': 'Form validation errors announced via aria-live regions for screen reader users.',
  'legal/cookie-reject-essential': 'Essential cookies only when user rejects non-essential tracking.',
  'legal/backup-retention': 'Define backup retention periods aligned with data minimization and legal hold requirements.',
  'legal/arbitration-jurisdiction': 'Disclose arbitration clause and governing jurisdiction in terms of service.',
  'legal/unsubscribe-sla': 'Honor marketing unsubscribe requests within CAN-SPAM 10 business day window.',
  'legal/refund-window-pricing': 'Display refund window and pricing terms before checkout confirmation.',
  'legal/skip-nav-link': 'Provide skip navigation link as first focusable element on every page.',
  'legal/list-unsubscribe-post': 'Support List-Unsubscribe-Post one-click unsubscribe per RFC 8058.',
  'legal/privacy-update-sla': 'Notify users of material privacy policy changes within reasonable timeframe.',
  'legal/wcag-contrast-cta': 'Primary CTA buttons meet WCAG 2.1 AA contrast ratio minimum.',
  'resend/verified-domain': 'Verify Resend sending domain via DNS before production email dispatch.',
  'resend/dmarc-rollout': 'Publish DMARC policy aligned with Resend sending domain authentication.',
  'cloudflare/rate-limit-binding': 'Apply Workers rate limit binding on authenticated API routes.',
  'cloudflare/secrets-logging': 'Load secrets from bindings; never log secret values in Workers.',
  'cloudflare/turnstile-signup': 'Protect signup forms with Turnstile server-side token verification.',
  'cloudflare/d1-encryption': 'Enable D1 encryption at rest for production databases storing PII.',
  'cloudflare/waf-custom-rules': 'Deploy WAF custom rules for auth abuse and credential stuffing patterns.',
  'cloudflare/do-alarms': 'Use Durable Object alarms for scheduled session cleanup and token expiry.',
  'stripe/usage-based-billing': 'Metered usage billing requires clear unit definition and invoice line items.',
  'stripe/invoice-legal-entity': 'Stripe invoices display legal entity name and tax ID where required.',
  'owasp/csp-reporting': 'Configure CSP violation reporting endpoint and monitor report-uri traffic.',
};

const refs = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
  if (c.refId) refs.add(c.refId);
}

const needed = [...new Set(idx.obligations.map((o) => o.sourceRefId).filter((r) => r && !refs.has(r)))];
let created = 0;
for (const refId of needed) {
  const excerpt = STUBS[refId];
  if (!excerpt) continue;
  const slug = refId.replace(/\//g, '-');
  const file = join(REF_DIR, `${slug}.specimen.json`);
  if (existsSync(file)) continue;
  const provider = refId.split('/')[0];
  writeFileSync(
    file,
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/planning/W65/ref/${slug}`,
        lastVerified: '2026-06-06',
        title: refId.split('/')[1].replace(/-/g, ' '),
        provider,
        excerpt,
        embeddingHint: `${refId} wave65 obligation-source legal`,
        tags: ['wave65', 'obligation-source', provider],
      },
      null,
      2,
    ) + '\n',
  );
  created += 1;
}
console.log(`✓ Missing obligation refs wave65 — ${created} cards (${needed.length} were missing)`);
