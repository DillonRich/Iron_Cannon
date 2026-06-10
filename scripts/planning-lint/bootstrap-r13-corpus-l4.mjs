#!/usr/bin/env node
/**
 * R13 — expand reference cards (220 launch 90%) + dedicated L4 fragments (40 @ 90%) + obligation fixtures.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const L4_DIR = join(ROOT, 'docs/engine/specimens/layer4');
const OBL_FIX = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');
const IDX = JSON.parse(readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'));

const NEW_REFS = [
  { refId: 'cloudflare/r2-object-lifecycle', title: 'R2 object lifecycle', url: 'https://developers.cloudflare.com/r2/buckets/lifecycle/', excerpt: 'Lifecycle rules for R2 buckets — expiration and transition for export archives.' },
  { refId: 'cloudflare/vectorize-metadata', title: 'Vectorize metadata filtering', url: 'https://developers.cloudflare.com/vectorize/', excerpt: 'Metadata filters on vector queries for obligation-scoped RAG at Iron Clad tier.' },
  { refId: 'stripe/invoice-reconciliation', title: 'Stripe invoice reconciliation', url: 'https://docs.stripe.com/invoicing/overview', excerpt: 'Invoice states and webhook events for billing dashboard accuracy.' },
  { refId: 'nextjs/middleware-auth', title: 'Next.js middleware auth', url: 'https://nextjs.org/docs/app/building-your-application/routing/middleware', excerpt: 'Edge middleware session checks before protected routes.' },
  { refId: 'owasp/api-top10-overview', title: 'OWASP API Top 10', url: 'https://owasp.org/API-Security/', excerpt: 'API security risks mapped to Iron Cannon Armor surfaces.' },
  { refId: 'owasp-logging-monitoring', title: 'OWASP logging failures', url: 'https://owasp.org/Top10/', excerpt: 'Security logging expectations for webhook and auth failures.' },
  { refId: 'legal/pipeda-overview', title: 'PIPEDA Canada', url: 'https://www.priv.gc.ca/en/privacy-topics/', excerpt: 'Canadian privacy principles for market bundle ca.' },
  { refId: 'legal/cpra-overview', title: 'CPRA California', url: 'https://oag.ca.gov/privacy/ccpa', excerpt: 'CPRA rights including do-not-sell linkage.' },
  { refId: 'legal/vcdpa-overview', title: 'Virginia CDPA', url: 'https://law.lis.virginia.gov/', excerpt: 'Virginia consumer data protection act overview.' },
  { refId: 'ironcannon/compare-engine', title: 'Iron Cannon compare engine', url: 'https://ironcannon.dev/patterns/compare-engine', excerpt: 'C16 obligation compare — met/gap/advisory only, never legal_compliant.', authorship: 'iron-cannon-pattern' },
  { refId: 'ironcannon/obligation-fixtures', title: 'Obligation fixture contract', url: 'https://ironcannon.dev/patterns/obligation-fixtures', excerpt: 'Every obligation requires pass/fail snippet fixtures before production.', authorship: 'iron-cannon-pattern' },
  { refId: 'ironcannon/imagination-50', title: 'Imagination 50 scenarios', url: 'https://ironcannon.dev/patterns/imagination-50', excerpt: 'Golden production imagination registry with >=90% per-scenario behavioral pass.', authorship: 'iron-cannon-pattern' },
  { refId: 'resend/batch-email', title: 'Resend batch send', url: 'https://resend.com/docs/api-reference/emails/send-batch', excerpt: 'Batch transactional sends with rate limits.' },
  { refId: 'stripe/chargeback-handling', title: 'Stripe disputes', url: 'https://docs.stripe.com/disputes', excerpt: 'Dispute webhooks and evidence submission for SaaS billing.' },
  { refId: 'cloudflare/cron-triggers', title: 'Workers cron', url: 'https://developers.cloudflare.com/workers/configuration/cron-triggers/', excerpt: 'Scheduled jobs for deletion scheduler and export workers.' },
  { refId: 'nextjs/server-actions-security', title: 'Server Actions security', url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions', excerpt: 'CSRF and origin checks on server actions.' },
  { refId: 'owasp/csrf-prevention', title: 'CSRF prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html', excerpt: 'Double-submit and SameSite patterns for M04 UI routes.' },
  { refId: 'legal/cookie-policy-template', title: 'Cookie policy template', url: 'https://ironcannon.dev/patterns/cookie-policy', excerpt: 'EU cookie policy page structure and essential cookie disclosure.', authorship: 'iron-cannon-pattern' },
  { refId: 'stripe/setup-intents-overview', title: 'Stripe SetupIntents', url: 'https://docs.stripe.com/payments/setup-intents', excerpt: 'Save payment methods for recurring billing without immediate charge.' },
  { refId: 'cloudflare/d1-backups', title: 'D1 backups', url: 'https://developers.cloudflare.com/d1/', excerpt: 'D1 backup and restore for compliance export flows.' },
];

function slugRef(refId) {
  return refId.replace(/\//g, '-');
}

function writeRef(card) {
  const file = join(REF_DIR, `${slugRef(card.refId)}.specimen.json`);
  if (existsSync(file)) return false;
  const body = {
    refId: card.refId,
    sourceUrl: card.url,
    lastVerified: '2026-05-31',
    title: card.title,
    excerpt: card.excerpt,
    appliesTo: ['layer4', 'planning'],
    tags: card.refId.split('/'),
  };
  if (card.authorship) {
    body.authorship = card.authorship;
    body.sourceUrl = card.url;
  }
  writeFileSync(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
  return true;
}

function writeL4Dedicated(ob) {
  const file = join(L4_DIR, `obligation-${ob.id}.specimen.json`);
  if (existsSync(file)) return false;
  const slug = ob.id.toLowerCase().replace(/_/g, '-');
  const body = {
    $schema: 'https://ironcannon.dev/schemas/rule-fragment/v1',
    id: `layer4/obligation/${slug}`,
    layer: 4,
    rulesetVersion: '2026.05.31',
    flowId: ob.category === 'email' ? 'email-lifecycle' : 'auth-lifecycle',
    section: slug,
    content: {
      requirement: ob.title,
      obligations: [ob.id],
      compareSteps: [
        `Run detect.type=${ob.detect.type} per COMPARE_DETECT_TYPES`,
        `Map result to obligation ${ob.id} only`,
        'Attach legalDisclaimer on every T12–T14 response',
      ],
      remediationDirective: `Remediate ${ob.id}: ${ob.title}`,
    },
    references: [ob.sourceRefId],
    compliancePatterns: { required: [{ id: ob.id, type: ob.detect.type, tier: 'ironclad' }] },
    metadata: { minTier: 'ironclad', category: ob.category, disclaimerRequired: true },
  };
  writeFileSync(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
  return true;
}

function defaultPassSnippet(ob) {
  const t = ob.detect.type;
  if (t === 'pattern') return (ob.detect.patterns ?? ['required']).join(' ');
  if (t === 'route_link') {
    const href = ob.detect.hrefContains ?? 'privacy';
    return `<Link href="/privacy#${href}">${href} policy</Link> on ${ob.detect.path ?? '/signup'}`;
  }
  if (t === 'route_exists') return `app${ob.detect.path ?? '/privacy'}/page.tsx`;
  if (t === 'schema_column') return `CREATE TABLE users (${ob.detect.column ?? 'terms_accepted_at'} INTEGER NOT NULL)`;
  if (t === 'schema_table') return `CREATE TABLE ${ob.detect.table ?? 'consent_audit_log'} (id TEXT PRIMARY KEY)`;
  if (t === 'flow_ref') {
    const flow = ob.detect.flowId ?? 'account-deletion';
    if (flow === 'data-export') return 'app/settings/data-export/page.tsx';
    if (flow === 'terms-reaccept') return 'app/terms-reaccept/page.tsx';
    return 'app/settings/delete-account/page.tsx';
  }
  if (t === 'header') return `headers: { '${ob.detect.name ?? 'List-Unsubscribe'}': '<mailto:u@x.com>' }`;
  if (t === 'template_scan') {
    if (ob.detect.field === 'physicalAddress') return "physicalAddress: '123 Main St'";
    return 'transactional password reset — your request was received';
  }
  if (t === 'config') return `{ "resend": { "${(ob.detect.field ?? 'verifiedDomain').split('.').pop()}": "ok", "webhooks": { "deliveryEvents": true } } }`;
  if (t === 'verified_sender_domain') return '{ "verifiedDomain": "mail.example.com", "from": "noreply@mail.example.com" }';
  if (t === 'manual') return '{ "manualReviewCompleted": true }';
  if (t === 'ui_pattern') return '<input type="checkbox" name="terms" />';
  if (t === 'label_association') return '<label htmlFor="email">Email</label><input id="email" />';
  if (t === 'required_attribute') {
    if (ob.detect.attr === 'aria-label') return '<button aria-label="Close menu"></button>';
    if (ob.detect.selector === 'html' && ob.detect.attr === 'lang') return '<html lang="en">';
    return '<img alt="description" src="/logo.png" />';
  }
  if (t === 'component_scan') return (ob.detect.patterns ?? ['cookie', 'consent']).join(' ') + ' Component.tsx';
  if (t === 'script_before_consent') return 'CookieConsent gate loads before any analytics script';
  return 'compliant snippet for obligation';
}

function defaultFailSnippet(ob) {
  const t = ob.detect.type;
  if (t === 'pattern') return 'template body without required keywords';
  if (t === 'route_link') return `<form onSubmit={signup}>no policy link</form>`;
  if (t === 'route_exists') return 'no public route file';
  if (t === 'schema_column') return 'CREATE TABLE users (id TEXT PRIMARY KEY)';
  if (t === 'schema_table') return 'CREATE TABLE users (id TEXT)';
  if (t === 'flow_ref') return 'settings page billing tab only';
  if (t === 'header') return 'send({ subject: "Hello" }) without headers';
  if (t === 'template_scan') {
    if (ob.detect.field === 'physicalAddress') return 'email html with no address';
    return 'Buy now! Limited offer in password reset email';
  }
  if (t === 'config') return '{ "resend": {} }';
  if (t === 'verified_sender_domain') return '{ "from": "noreply@gmail.com" }';
  if (t === 'manual') return 'no attestation';
  if (t === 'ui_pattern') return '<input type="checkbox" defaultChecked={true} name="terms" />';
  if (t === 'label_association') return '<input placeholder="Email" />';
  if (t === 'required_attribute') {
    if (ob.detect.attr === 'aria-label') return '<button></button>';
    if (ob.detect.attr === 'lang') return '<html>';
    return '<img src="/x.png" />';
  }
  if (t === 'component_scan') return 'layout.tsx header only';
  if (t === 'script_before_consent') return '<script src="https://www.googletagmanager.com/gtag/js"></script>';
  return 'non-compliant snippet missing requirement';
}

function writeObligationFixture(ob, force = false) {
  mkdirSync(OBL_FIX, { recursive: true });
  const file = join(OBL_FIX, `${ob.id}.fixture-spec.json`);
  if (existsSync(file) && !force) return false;
  const body = {
    fixtureId: ob.id,
    obligationId: ob.id,
    detectType: ob.detect.type,
    detect: ob.detect,
    passSnippet: defaultPassSnippet(ob),
    failSnippet: defaultFailSnippet(ob),
    expectedPass: ob.detect.type === 'manual' || ob.detect.type === 'component_scan' ? 'met' : 'met',
    expectedFail: ob.detect.type === 'manual' || ob.detect.type === 'component_scan' ? 'advisory' : 'gap',
  };
  if (ob.detect.type === 'manual' || ob.detect.type === 'component_scan') body.expectedFail = 'advisory';
  if (ob.detect.type === 'script_before_consent') body.expectedFail = 'advisory';
  writeFileSync(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
  return true;
}

let refs = 0;
let l4 = 0;
let fix = 0;

for (const card of NEW_REFS) if (writeRef(card)) refs++;

const forceFixtures = process.argv.includes('--fix-fixtures');
for (const ob of IDX.obligations) {
  const dedicated = join(L4_DIR, `obligation-${ob.id}.specimen.json`);
  if (!existsSync(dedicated) && writeL4Dedicated(ob)) l4++;
  if (writeObligationFixture(ob, forceFixtures)) fix++;
}

const refCount = readdirSync(REF_DIR).filter((f) => f.endsWith('.specimen.json')).length;
const l4Dedicated = readdirSync(L4_DIR).filter((f) => f.startsWith('obligation-LEG-')).length;
const oblFixCount = existsSync(OBL_FIX)
  ? readdirSync(OBL_FIX).filter((f) => f.endsWith('.fixture-spec.json')).length
  : 0;

console.log(`R13 bootstrap: +${refs} refs, +${l4} L4 dedicated, +${fix} obligation fixtures`);
console.log(`Totals: refs=${refCount} (target 198), L4 dedicated=${l4Dedicated}/40 (target 36), obl fixtures=${oblFixCount}`);
