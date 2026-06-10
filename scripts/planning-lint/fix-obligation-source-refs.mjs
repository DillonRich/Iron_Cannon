#!/usr/bin/env node
/** Remap wave30 sourceRefIds to existing corpus cards */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const IDX_PATH = join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json');

const REMAP = {
  'legal/gdpr-subprocessors': 'legal/gdpr-privacy-notice',
  'legal/cookie-policy': 'legal/cookie-policy-template',
  'legal/cookie-consent-gating': 'legal/cookie-consent-eu',
  'legal/gdpr-consent-withdraw': 'legal/gdpr-consent-basics',
  'legal/refund-policy-disclosure': 'legal/tos-acceptance-record',
  'legal/subscription-cancel-disclosure': 'legal/tos-acceptance-record',
  'stripe/pricing-display': 'stripe/api-checkout-sessions',
  'stripe/tax-collection': 'stripe/api-checkout-sessions',
  'stripe/payment-failed-email': 'stripe/api-events-types',
  'legal/trial-disclosure': 'legal/tos-acceptance-record',
  'stripe/customer-portal': 'stripe/api-customers',
  'legal/pci-saqs-a': 'legal/disclaimer',
  'legal/gdpr-portability': 'legal/gdpr-data-subject-rights',
  'legal/deletion-grace-period': 'legal/gdpr-erasure',
  'legal/export-link-ttl': 'legal/gdpr-access',
  'stripe/customer-delete': 'stripe/api-customers',
  'resend/suppression-list': 'legal/can-spam-unsubscribe',
  'stripe/idempotent-webhook': 'stripe/webhooks',
  'stripe/past-due-billing': 'stripe/api-invoices',
  'owasp/auth-rate-limit': 'owasp/authentication',
  'owasp/reset-token': 'owasp/authentication',
  'legal/verified-email-gate': 'legal/privacy-policy-link',
  'stripe/checkout-success-verify': 'stripe/api-checkout-sessions',
  'ironcannon/hybrid-stack': 'ironcannon/hybrid-stack-detection',
  'stripe/test-live-separation': 'stripe/api',
  'ironcannon/resume-tier': 'ironcannon/verify-mandate',
  'legal/can-spam-sender-id': 'legal/can-spam-compliance-guide',
  'legal/can-spam-subject': 'legal/can-spam-compliance-guide',
  'legal/can-spam-recipient': 'legal/can-spam-unsubscribe',
  'legal/can-spam-transactional': 'legal/transactional-vs-marketing',
  'resend/bounce-handling': 'resend/docs-webhooks-emails-bounced',
  'legal/privacy-retention': 'legal/privacy-policy-link',
  'legal/gdpr-dpa': 'legal/gdpr-privacy-notice',
  'legal/ccpa-do-not-sell': 'legal/ccpa-do-not-sell',
  'legal/wcag-error-identification': 'legal/wcag-aria-basics',
  'legal/wcag-status-messages': 'legal/wcag-aria-basics',
  'legal/can-spam-sender-id': 'legal/can-spam-compliance-guide',
  'legal/can-spam-subject': 'legal/can-spam-compliance-guide',
  'legal/can-spam-recipient': 'legal/can-spam-unsubscribe',
  'legal/can-spam-transactional': 'legal/transactional-vs-marketing',
  'resend/bounce-handling': 'resend/docs-webhooks-emails-bounced',
};

const idx = JSON.parse(readFileSync(IDX_PATH, 'utf8'));
let n = 0;
for (const ob of idx.obligations) {
  const mapped = REMAP[ob.sourceRefId];
  if (mapped) {
    ob.sourceRefId = mapped;
    n++;
  }
}
writeFileSync(IDX_PATH, JSON.stringify(idx, null, 2) + '\n');
console.log(`✓ Remapped ${n} obligation sourceRefIds`);
