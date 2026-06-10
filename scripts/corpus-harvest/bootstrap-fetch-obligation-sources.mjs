#!/usr/bin/env node
/** Fetch missing obligation sourceRef URLs into drafts (legal/owasp depth) */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';
import { refIdFromUrl, specimenFilename } from './lib/ref-id.mjs';
import { distillHtml, distillMarkdown } from './lib/distill.mjs';

const idx = JSON.parse(
  readFileSync(join(PATHS.root, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const refs = new Set();
for (const f of readdirSync(PATHS.references).filter((x) => x.endsWith('.specimen.json'))) {
  const c = JSON.parse(readFileSync(join(PATHS.references, f), 'utf8'));
  if (c.refId) refs.add(c.refId);
}

const URL_MAP = {
  'legal/wcag-alt-text': 'https://www.w3.org/WAI/WCAG21/Understanding/text-alternatives.html',
  'legal/gdpr-data-subject-rights': 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/',
  'legal/gdpr-privacy-notice': 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/privacy-notices-transparency-and-control/',
  'legal/can-spam-compliance-guide':
    'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business',
  'legal/cookie-consent-basics': 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/cookies-and-similar-technologies/',
  'owasp/csrf-prevention':
    'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
  'owasp/session-management':
    'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
  'owasp/password-storage':
    'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
  'owasp/security-txt':
    'https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html',
  'stripe/test-mode-block': 'https://docs.stripe.com/keys.md',
  'cloudflare/waf-custom-rules': 'https://developers.cloudflare.com/waf/custom-rules/create/index.md',
  'cloudflare/do-alarms': 'https://developers.cloudflare.com/durable-objects/api/alarms.md',
  'legal/ccpa-do-not-sell': 'https://oag.ca.gov/privacy/ccpa',
  'legal/ada-title-iii-web': 'https://www.ada.gov/resources/web-guidance/',
  'legal/gdpr-consent-basics': 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/',
  'legal/eprivacy-directive': 'https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/',
  'stripe/webhook-signature': 'https://docs.stripe.com/webhooks/signatures',
  'stripe/radar-fraud': 'https://docs.stripe.com/radar',
  'legal/gdpr-data-portability': 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/right-to-data-portability/',
  'legal/ai-disclosure': 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
  'legal/eu-transfer-mechanism': 'https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/international-transfers/',
  'legal/status-page-link': 'https://www.atlassian.com/incident-management/incident-communication/templates/status-page',
  'legal/wcag-form-labels': 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
  'legal/wcag-aria-basics': 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
  'legal/wcag-focus-visible': 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
  'legal/wcag-skip-nav': 'https://www.w3.org/WAI/WCAG21/Techniques/html/H69',
  'legal/wcag-contrast-min': 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
  'legal/privacy-policy-link': 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/privacy-notices-transparency-and-control/what-to-include/',
  'legal/can-spam-unsubscribe': 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business',
  'legal/ccpa-overview': 'https://oag.ca.gov/privacy/ccpa',
  'legal/coppa-overview': 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa',
  'legal/cookie-consent-eu': 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/cookies-and-similar-technologies/',
  'resend/domains-verify': 'https://resend.com/docs/dashboard/domains/introduction',
  'cloudflare/turnstile': 'https://developers.cloudflare.com/turnstile/',
  'cloudflare/d1-migrations': 'https://developers.cloudflare.com/d1/reference/migrations/',
};

let fetched = 0;
mkdirSync(PATHS.drafts, { recursive: true });

for (const ob of idx.obligations) {
  const refId = ob.sourceRefId;
  if (!refId || refs.has(refId)) continue;
  const url = URL_MAP[refId];
  if (!url) continue;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'IronCannon-CorpusHarvest/1.0' } });
    if (!res.ok) continue;
    const body = await res.text();
    const excerpt = distillHtml(ob.title, body);
    if (excerpt.length < 80) continue;
    const draft = {
      refId,
      sourceUrl: url,
      lastVerified: new Date().toISOString().slice(0, 10),
      title: ob.title.slice(0, 200),
      excerpt,
      tags: [refId.split('/')[0], ob.category ?? 'compliance'],
      harvestMeta: { autoApproved: true, source: 'obligation-bootstrap' },
    };
    const fname = specimenFilename(refId).replace('.specimen.json', '.draft.json');
    writeFileSync(join(PATHS.drafts, fname), JSON.stringify(draft, null, 2) + '\n');
    refs.add(refId);
    fetched += 1;
    console.log(`  ✓ draft ${refId}`);
    await new Promise((r) => setTimeout(r, 800));
  } catch (e) {
    console.warn(`  skip ${refId}: ${e.message}`);
  }
}

console.log(`✓ Obligation source bootstrap — ${fetched} drafts`);
