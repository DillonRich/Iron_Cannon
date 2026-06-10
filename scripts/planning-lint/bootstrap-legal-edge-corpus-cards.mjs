#!/usr/bin/env node
/** Planning-phase legal + edge reference cards (official-style excerpts) */
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const CARDS = [
  { refId: 'legal/trial-disclosure', sourceUrl: 'https://www.ftc.gov/business-guidance/resources', title: 'Trial and subscription disclosure', excerpt: 'Before collecting payment method for a free trial, disclose trial length, price after trial, cancellation method, and billing interval. Display near the submit button.', tags: ['legal', 'billing'] },
  { refId: 'legal/deletion-grace-period', sourceUrl: 'https://gdpr.eu/right-to-be-forgotten/', title: 'Deletion grace period', excerpt: 'Account deletion flows should state retention period before purge, allow cancellation of deletion request during grace window, and log deletion_scheduled_at.', tags: ['legal', 'data-rights'] },
  { refId: 'legal/export-link-ttl', sourceUrl: 'https://gdpr.eu/right-to-data-portability/', title: 'Export download TTL', excerpt: 'Data export download links must expire (recommended 24–72 hours), require authentication to request export, and use signed URLs.', tags: ['legal', 'data-rights'] },
  { refId: 'legal/gdpr-subprocessors', sourceUrl: 'https://gdpr.eu/article-28-processor/', title: 'Subprocessor disclosure', excerpt: 'Privacy policy or DPA should list subprocessors (email, payments, hosting) with purpose and link to their policies.', tags: ['legal', 'privacy'] },
  { refId: 'legal/cookie-consent-gating', sourceUrl: 'https://gdpr.eu/cookies/', title: 'Consent-gated analytics', excerpt: 'Non-essential cookies and tracking scripts must not execute until affirmative consent. Reject must be as prominent as accept.', tags: ['legal', 'cookies'] },
  { refId: 'legal/refund-policy-disclosure', sourceUrl: 'https://stripe.com/legal', title: 'Refund policy near checkout', excerpt: 'Link refund and cancellation policy on billing settings and pre-checkout surfaces when selling subscriptions.', tags: ['legal', 'billing'] },
  { refId: 'legal/subscription-cancel-disclosure', sourceUrl: 'https://stripe.com/docs/billing/subscriptions/cancel', title: 'Cancel subscription UX', excerpt: 'Users must reach cancel flow from account settings or Customer Portal without dark patterns.', tags: ['legal', 'billing'] },
  { refId: 'legal/pci-saqs-a', sourceUrl: 'https://www.pcisecuritystandards.org/document_library', title: 'PCI SAQ A scope', excerpt: 'Use hosted payment fields (Stripe Elements/Payment Element). Never store PAN/CVV on your servers.', tags: ['legal', 'security'] },
  { refId: 'legal/verified-email-gate', sourceUrl: 'https://owasp.org/www-project-web-security-testing-guide/', title: 'Verified email before sensitive action', excerpt: 'Require email_verified_at before checkout, deletion, or export. Resend verification from settings.', tags: ['legal', 'security'] },
  { refId: 'legal/privacy-retention', sourceUrl: 'https://gdpr.eu/privacy-notice/', title: 'Retention in privacy notice', excerpt: 'Privacy policy must state retention periods per data category and legal basis for processing.', tags: ['legal', 'privacy'] },
  { refId: 'legal/gdpr-dpa', sourceUrl: 'https://gdpr.eu/article-28-processor/', title: 'Data processing agreement', excerpt: 'B2B EU customers may require DPA with Stripe/Resend as sub-processors documented.', tags: ['legal', 'privacy'] },
  { refId: 'owasp/reset-token', sourceUrl: 'https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html', title: 'Password reset token', excerpt: 'Tokens must be single-use, hashed at rest, expire within 1 hour, sent only to verified email.', tags: ['owasp', 'security'] },
  { refId: 'stripe/past-due-billing', sourceUrl: 'https://stripe.com/docs/billing/subscriptions/overview', title: 'Past due subscriptions', excerpt: 'Handle customer.subscription.updated and invoice.payment_failed; show update payment method in app.', tags: ['stripe', 'billing'] },
  { refId: 'stripe/idempotent-webhook', sourceUrl: 'https://stripe.com/docs/webhooks', title: 'Webhook idempotency', excerpt: 'Store processed event IDs; return 2xx only after side effects complete.', tags: ['stripe', 'security'] },
  { refId: 'stripe/checkout-success-verify', sourceUrl: 'https://stripe.com/docs/checkout/quickstart', title: 'Verify checkout server-side', excerpt: 'Success page must retrieve Checkout Session by ID server-side; never trust client-only success.', tags: ['stripe', 'billing'] },
  { refId: 'stripe/payment-failed-email', sourceUrl: 'https://stripe.com/docs/billing/revenue-recovery', title: 'Payment failed emails', excerpt: 'Send transactional email on invoice.payment_failed with portal link; not marketing template.', tags: ['stripe', 'email'] },
  { refId: 'stripe/pricing-display', sourceUrl: 'https://stripe.com/docs/payments/checkout', title: 'Display pricing', excerpt: 'Show currency, interval, and trial terms on checkout surface before payment.', tags: ['stripe', 'billing'] },
  { refId: 'stripe/tax-collection', sourceUrl: 'https://stripe.com/docs/tax', title: 'Stripe Tax', excerpt: 'Enable automatic_tax when selling across regions; disclose tax behavior in UI.', tags: ['stripe', 'billing'] },
  { refId: 'stripe/customer-delete', sourceUrl: 'https://stripe.com/docs/api/customers/delete', title: 'Delete Stripe customer', excerpt: 'On account deletion, delete or anonymize Stripe customer after grace period.', tags: ['stripe', 'data-rights'] },
  { refId: 'resend/suppression-list', sourceUrl: 'https://resend.com/docs/dashboard/audiences/introduction', title: 'Suppression on deletion', excerpt: 'Add deleted user emails to suppression; stop marketing sends immediately.', tags: ['resend', 'email'] },
  { refId: 'ironcannon/edge-case-registry', sourceUrl: 'https://ironcannon.dev/planning/edge-case-registry', title: 'Edge case registry', excerpt: 'T02/T07 signals map to EC-* rows with obligation and protocol mitigations for agent directives.', tags: ['ironcannon', 'planning'] },
  { refId: 'ironcannon/tier-compose-redaction', sourceUrl: 'https://ironcannon.dev/planning/tier-redaction', title: 'Tier compose redaction', excerpt: 'Pro tier T04 strips L4 rules, legal/* cards, and legalCompliance outbound keys server-side.', tags: ['ironcannon', 'tier'] },
  { refId: 'ironcannon/resume-tier', sourceUrl: 'https://ironcannon.dev/planning/resume', title: 'Resume tier changed', excerpt: 'If API key tier differs from session, return RESUME_TIER_CHANGED and require re-auth.', tags: ['ironcannon', 'tier'] },
  { refId: 'legal/wcag-error-identification', sourceUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html', title: 'Error identification', excerpt: 'Associate validation errors with fields via aria-describedby; announce in aria-live region.', tags: ['legal', 'a11y'] },
  { refId: 'legal/wcag-status-messages', sourceUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html', title: 'Status messages', excerpt: 'Loading and success states use role=status or aria-live polite.', tags: ['legal', 'a11y'] },
];

let created = 0;
for (const c of CARDS) {
  const slug = c.refId.replace(/\//g, '-');
  const path = join(REF_DIR, `${slug}.specimen.json`);
  if (existsSync(path)) continue;
  writeFileSync(
    path,
    JSON.stringify(
      {
        refId: c.refId,
        sourceUrl: c.sourceUrl,
        lastVerified: '2026-06-03',
        title: c.title,
        excerpt: c.excerpt,
        tags: c.tags,
      },
      null,
      2,
    ) + '\n',
  );
  created++;
}
console.log(`✓ Legal/edge corpus cards — ${created} new (${CARDS.length} catalogued)`);
