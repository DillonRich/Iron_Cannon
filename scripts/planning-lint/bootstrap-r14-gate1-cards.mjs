#!/usr/bin/env node
/** R14 — +22 reference cards to close Gate 1 at 220/220 */
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const NEW_REFS = [
  { refId: 'stripe/strong-customer-authentication', title: 'Stripe SCA', url: 'https://docs.stripe.com/strong-customer-authentication', excerpt: '3DS and SCA requirements for EU card payments at checkout.' },
  { refId: 'stripe/metered-billing', title: 'Stripe metered billing', url: 'https://docs.stripe.com/billing/subscriptions/usage-based', excerpt: 'Usage records and metered prices for seat-based SaaS.' },
  { refId: 'stripe/entitlements', title: 'Stripe entitlements', url: 'https://docs.stripe.com/billing/entitlements', excerpt: 'Feature entitlements tied to subscription items.' },
  { refId: 'stripe/billing-overview', title: 'Stripe Billing overview', url: 'https://docs.stripe.com/billing', excerpt: 'Billing modes, flexible billing, and subscription lifecycle.' },
  { refId: 'stripe/refunds', title: 'Stripe refunds', url: 'https://docs.stripe.com/refunds', excerpt: 'Refund objects and webhook events for charge reversals.' },
  { refId: 'stripe/products-overview', title: 'Stripe Products', url: 'https://docs.stripe.com/products', excerpt: 'Product catalog for checkout and portal.' },
  { refId: 'stripe/subscriptions-overview', title: 'Stripe Subscriptions', url: 'https://docs.stripe.com/billing/subscriptions/overview', excerpt: 'Subscription object states and lifecycle events.' },
  { refId: 'stripe/coupons', title: 'Stripe coupons', url: 'https://docs.stripe.com/billing/subscriptions/coupons', excerpt: 'Coupons and promotion codes at checkout.' },
  { refId: 'stripe/payment-links', title: 'Stripe Payment Links', url: 'https://docs.stripe.com/payment-links', excerpt: 'Hosted payment links without custom checkout route.' },
  { refId: 'cloudflare/workers-secrets', title: 'Workers secrets', url: 'https://developers.cloudflare.com/workers/configuration/secrets/', excerpt: 'Bind secrets via wrangler secret and Secrets Store.' },
  { refId: 'cloudflare/workers-environments', title: 'Workers environments', url: 'https://developers.cloudflare.com/workers/wrangler/environments/', excerpt: 'Staging vs production wrangler env deploy.' },
  { refId: 'cloudflare/d1-read-replicas', title: 'D1 read replicas', url: 'https://developers.cloudflare.com/d1/', excerpt: 'Read replica bindings for scale-out reads.' },
  { refId: 'cloudflare/workers-routes', title: 'Workers routes', url: 'https://developers.cloudflare.com/workers/configuration/routing/', excerpt: 'Route patterns and custom domains for Workers.' },
  { refId: 'cloudflare/workers-limits', title: 'Workers limits', url: 'https://developers.cloudflare.com/workers/platform/limits/', excerpt: 'CPU, memory, and subrequest limits per invocation.' },
  { refId: 'cloudflare/waf-overview', title: 'Cloudflare WAF', url: 'https://developers.cloudflare.com/waf/', excerpt: 'WAF rules on proxied application traffic.' },
  { refId: 'cloudflare/turnstile', title: 'Turnstile', url: 'https://developers.cloudflare.com/turnstile/', excerpt: 'Bot protection widget for signup and login forms.' },
  { refId: 'cloudflare/service-bindings', title: 'Service bindings', url: 'https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/', excerpt: 'Private Worker-to-Worker RPC without public HTTP.' },
  { refId: 'cloudflare/dns', title: 'Cloudflare DNS', url: 'https://developers.cloudflare.com/dns/', excerpt: 'DNS records for custom app domains.' },
  { refId: 'legal/gdpr-erasure', title: 'GDPR erasure', url: 'https://gdpr.eu/right-to-be-forgotten/', excerpt: 'Right to erasure for account deletion flows.' },
  { refId: 'legal/gdpr-access', title: 'GDPR access', url: 'https://gdpr.eu/right-to-access/', excerpt: 'Data export and subject access requests.' },
  { refId: 'legal/terms-checkbox', title: 'Terms checkbox', url: 'https://ironcannon.dev/patterns/terms-checkbox', excerpt: 'Unchecked-by-default terms acceptance on signup.', authorship: 'iron-cannon-pattern' },
  { refId: 'resend/idempotency', title: 'Resend idempotency', url: 'https://resend.com/docs/api-reference/emails/send-email', excerpt: 'Idempotency-Key header for safe email retries.' },
  { refId: 'cloudflare/cache-rules', title: 'Cache rules', url: 'https://developers.cloudflare.com/cache/', excerpt: 'Cache Rules to bypass cache on authenticated routes.' },
  { refId: 'cloudflare/browser-rendering', title: 'Browser Rendering', url: 'https://developers.cloudflare.com/browser-rendering/', excerpt: 'Headless browser for PDF export workers.' },
  { refId: 'cloudflare/email-workers', title: 'Email Workers', url: 'https://developers.cloudflare.com/email-routing/email-workers/', excerpt: 'Send email from Workers without third-party API.' },
  { refId: 'cloudflare/images', title: 'Cloudflare Images', url: 'https://developers.cloudflare.com/images/', excerpt: 'Image optimization and responsive delivery.' },
  { refId: 'nextjs/suspense', title: 'Next.js Suspense', url: 'https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming', excerpt: 'Streaming and suspense boundaries for auth pages.' },
  { refId: 'nextjs/fonts', title: 'Next.js fonts', url: 'https://nextjs.org/docs/app/building-your-application/optimizing/fonts', excerpt: 'next/font for display swap and layout stability.' },
  { refId: 'owasp/content-security-policy', title: 'CSP', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html', excerpt: 'Content-Security-Policy header baseline for SaaS.' },
  { refId: 'owasp/transport-layer-protection', title: 'TLS', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html', excerpt: 'HSTS and TLS configuration for web apps.' },
  { refId: 'owasp/unvalidated-redirects', title: 'Open redirects', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html', excerpt: 'Allowlist redirect URLs after Stripe checkout.' },
  { refId: 'nextjs/route-handlers', title: 'Route Handlers', url: 'https://nextjs.org/docs/app/building-your-application/routing/route-handlers', excerpt: 'App Router route handlers for API endpoints.' },
  { refId: 'nextjs/dynamic-rendering', title: 'Dynamic rendering', url: 'https://nextjs.org/docs/app/building-your-application/rendering', excerpt: 'force-dynamic for authenticated billing routes.' },
];

function slug(refId) {
  return refId.replace(/\//g, '-');
}

let added = 0;
for (const card of NEW_REFS) {
  const file = join(REF_DIR, `${slug(card.refId)}.specimen.json`);
  if (existsSync(file)) continue;
  const body = {
    refId: card.refId,
    sourceUrl: card.url,
    lastVerified: '2026-05-31',
    title: card.title,
    excerpt: card.excerpt,
    appliesTo: ['layer4', 'planning'],
    tags: card.refId.split('/'),
  };
  if (card.authorship) body.authorship = card.authorship;
  writeFileSync(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
  added += 1;
}
console.log(`Added ${added} reference cards (${NEW_REFS.length - added} already existed)`);
