#!/usr/bin/env node
/** EM-1 — full phase lattice: BUILD (EM-0) + TEST/VERIFY/SECURITY/COMPLIANCE/ATTESTATION + flow gates */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const em0 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em0-flow-steps.json'), 'utf8'),
);

const GOLDEN_12 = new Set([
  'M01-auth-d1-schema', 'M02-auth-worker-routes', 'M03-auth-resend-emails', 'M04-auth-ui-routes',
  'M05-auth-session-middleware', 'M10-billing-d1-schema', 'M11-stripe-checkout-route',
  'M12-stripe-webhook', 'M13-provisioning-kv', 'M14-billing-success-ui',
  'M15-billing-dashboard-ui', 'M16-billing-emails',
]);

const MODULES = [
  { moduleId: 'M01-auth-d1-schema', route: '/internal/migrations', flow: 'auth-lifecycle', host: 'nextjs', security: ['tenant_isolation'], refs: ['cloudflare/d1-migrations'] },
  { moduleId: 'M02-auth-worker-routes', route: '/api/auth/login', flow: 'auth-lifecycle', host: 'cloudflare', security: ['rate_limit', 'csrf'], refs: ['owasp/authentication'] },
  { moduleId: 'M03-auth-resend-emails', route: '/api/auth/verify', flow: 'auth-lifecycle', host: 'resend', security: ['idempotency_key'], refs: ['resend/docs-webhooks-introduction'] },
  { moduleId: 'M04-auth-ui-routes', route: '/signup', flow: 'auth-lifecycle', host: 'nextjs', security: ['csrf'], legal: ['LEG-PRIV-001', 'LEG-TERMS-003', 'LEG-COOKIE-001'], refs: ['nextjs/middleware'] },
  { moduleId: 'M05-auth-session-middleware', route: '/dashboard', flow: 'auth-lifecycle', host: 'nextjs', security: ['session_middleware'], legal: ['LEG-A11Y-001'], refs: ['owasp/session-management'] },
  { moduleId: 'M10-billing-d1-schema', route: '/migrations/billing', flow: 'billing-subscription', host: 'nextjs', security: ['tenant_isolation'], refs: ['cloudflare/d1-migrations'] },
  { moduleId: 'M11-stripe-checkout-route', route: '/api/billing/checkout', flow: 'billing-subscription', host: 'cloudflare', security: ['auth_required'], legal: ['LEG-STRIPE-003', 'LEG-STRIPE-006'], refs: ['stripe/api-checkout-sessions-create'] },
  { moduleId: 'M12-stripe-webhook', route: '/api/webhooks/stripe', flow: 'billing-subscription', host: 'cloudflare', security: ['signature_verify', 'idempotency_kv'], legal: ['LEG-EDGE-001'], refs: ['stripe/webhooks'] },
  { moduleId: 'M13-provisioning-kv', route: '/internal/provision', flow: 'billing-race-shield', host: 'cloudflare', security: ['idempotency_kv'], refs: ['cloudflare/kv'] },
  { moduleId: 'M14-billing-success-ui', route: '/checkout/success', flow: 'billing-race-shield', host: 'nextjs', security: ['auth_required'], legal: ['LEG-EDGE-006'], refs: ['stripe/api-checkout-sessions'] },
  { moduleId: 'M15-billing-dashboard-ui', route: '/settings/billing', flow: 'billing-subscription', host: 'nextjs', security: ['auth_required'], legal: ['LEG-STRIPE-001', 'LEG-STRIPE-002', 'LEG-PRIV-011'], refs: ['stripe/api-customers'] },
  { moduleId: 'M16-billing-emails', route: '/api/billing/notify', flow: 'email-lifecycle', host: 'resend', security: ['transactional_only'], legal: ['LEG-EMAIL-001', 'LEG-EMAIL-009'], refs: ['legal/transactional-vs-marketing'] },
  { moduleId: 'M20-reset-token-schema', route: '/migrations/reset', flow: 'password-reset', host: 'nextjs', security: ['tenant_isolation'], legal: ['LEG-EDGE-004'], refs: ['cloudflare/d1-migrations'] },
  { moduleId: 'M21-reset-api', route: '/api/auth/forgot-password', flow: 'password-reset', host: 'cloudflare', security: ['rate_limit'], legal: ['LEG-EDGE-003'], refs: ['owasp/authentication'] },
  { moduleId: 'M22-reset-ui', route: '/forgot-password', flow: 'password-reset', host: 'nextjs', security: ['csrf'], refs: ['nextjs/middleware'] },
  { moduleId: 'M23-reset-email', route: '/api/auth/send-reset', flow: 'password-reset', host: 'resend', security: ['transactional_only'], legal: ['LEG-EMAIL-002'], refs: ['legal/can-spam-unsubscribe'] },
  { moduleId: 'M30-onboarding-schema', route: '/migrations/onboarding', flow: 'onboarding', host: 'nextjs', legal: ['LEG-PRIV-001'], refs: ['cloudflare/d1-migrations'] },
  { moduleId: 'M31-onboarding-api', route: '/api/onboarding/complete', flow: 'onboarding', host: 'cloudflare', security: ['auth_required'], legal: ['LEG-TERMS-003'], refs: ['ironcannon/verify-mandate'] },
  { moduleId: 'M32-onboarding-ui', route: '/onboarding', flow: 'onboarding', host: 'nextjs', security: ['csrf'], legal: ['LEG-COOKIE-001'], refs: ['nextjs/middleware'] },
  { moduleId: 'M40-deletion-api', route: '/api/account/delete-request', flow: 'account-deletion', host: 'cloudflare', security: ['reauth'], legal: ['LEG-DATA-001', 'LEG-DATA-005'], refs: ['legal/gdpr-erasure'] },
  { moduleId: 'M41-deletion-scheduler', route: '/cron/deletion', flow: 'account-deletion', host: 'cloudflare', security: ['cron_auth'], legal: ['LEG-DATA-003', 'LEG-DATA-006'], refs: ['stripe/api-customers'] },
  { moduleId: 'M42-deletion-ui', route: '/settings/danger', flow: 'account-deletion', host: 'nextjs', security: ['confirm_email'], legal: ['LEG-DATA-001', 'LEG-DATA-003'], refs: ['legal/gdpr-erasure'] },
  { moduleId: 'M50-export-api', route: '/api/account/export', flow: 'data-export', host: 'cloudflare', security: ['auth_required'], legal: ['LEG-DATA-002', 'LEG-DATA-004'], refs: ['legal/gdpr-data-subject-rights'] },
  { moduleId: 'M51-export-worker', route: '/internal/export-job', flow: 'data-export', host: 'cloudflare', security: ['tenant_isolation'], legal: ['LEG-DATA-004'], refs: ['cloudflare/workers'] },
  { moduleId: 'M52-export-ui', route: '/settings/export', flow: 'data-export', host: 'nextjs', security: ['csrf'], legal: ['LEG-DATA-002'], refs: ['legal/gdpr-access'] },
  { moduleId: 'M55-terms-reaccept-api', route: '/api/legal/reaccept', flow: 'terms-reaccept', host: 'cloudflare', security: ['auth_required'], legal: ['LEG-TERMS-005', 'LEG-TERMS-002'], refs: ['legal/tos-acceptance-record'] },
  { moduleId: 'M56-terms-reaccept-ui', route: '/legal/reaccept', flow: 'terms-reaccept', host: 'nextjs', security: ['csrf'], legal: ['LEG-TERMS-005', 'LEG-TERMS-004'], refs: ['legal/tos-acceptance-record'] },
];

const FLOW_GATES = [
  { nodeId: 'flow/auth-lifecycle/discover', flow: 'auth-lifecycle', phase: 'DISCOVER', agentGuidance: 'T01 SD-01 stack detect' },
  { nodeId: 'flow/auth-lifecycle/wiremap', flow: 'auth-lifecycle', phase: 'WIREMAP', agentGuidance: 'T03 approve wiremap' },
  { nodeId: 'flow/billing-subscription/discover', flow: 'billing-subscription', phase: 'DISCOVER', agentGuidance: 'Stripe keys + webhook secret' },
  { nodeId: 'flow/billing-subscription/wiremap', flow: 'billing-subscription', phase: 'WIREMAP', agentGuidance: 'M10-M16 module order' },
  { nodeId: 'flow/password-reset/wiremap', flow: 'password-reset', phase: 'WIREMAP', agentGuidance: 'APPEND_SPLIT M20-M23' },
  { nodeId: 'flow/account-deletion/compliance', flow: 'account-deletion', phase: 'COMPLIANCE', agentGuidance: 'Iron Clad T12-T14 before deletion cron' },
  { nodeId: 'flow/data-export/compliance', flow: 'data-export', phase: 'COMPLIANCE', agentGuidance: 'LEG-DATA-002 portability' },
  { nodeId: 'flow/billing-race-shield/verify', flow: 'billing-race-shield', phase: 'VERIFY', agentGuidance: 'Checkout race server verify' },
  { nodeId: 'flow/email-lifecycle/compliance', flow: 'email-lifecycle', phase: 'COMPLIANCE', agentGuidance: 'CAN-SPAM + transactional only' },
  { nodeId: 'flow/global/armor-pass', flow: 'auth-lifecycle', phase: 'ARMOR_PASS', agentGuidance: 'T09-T11 after golden attestation' },
  { nodeId: 'flow/global/ironclad-pass', flow: 'auth-lifecycle', phase: 'IRONCLAD_PASS', agentGuidance: 'T12-T14 market bundle' },
];

const RESUME = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/resume-path-harness.json'), 'utf8'),
);

const ARMOR = [
  { nodeId: 'armor/A01-security-surface-map', moduleIds: ['A01-security-surface-map'], phase: 'SECURITY', flow: 'auth-lifecycle', agentGuidance: 'T09 surface map after attestation' },
  { nodeId: 'armor/A02-session-hardening', moduleIds: ['A02-session-hardening-pass'], phase: 'SECURITY', flow: 'auth-lifecycle', agentGuidance: 'T10 session hardening' },
  { nodeId: 'armor/A03-webhook-hardening', moduleIds: ['A03-webhook-hardening-pass'], phase: 'SECURITY', flow: 'billing-subscription', agentGuidance: 'T10 webhook hardening' },
];

const UX_ROUTES = [
  { nodeId: 'ux/signup/a11y', route: '/signup', legal: ['LEG-A11Y-001', 'LEG-A11Y-002'], flow: 'auth-lifecycle' },
  { nodeId: 'ux/settings/privacy-links', route: '/settings/privacy', legal: ['LEG-PRIV-001', 'LEG-PRIV-011'], flow: 'auth-lifecycle' },
  { nodeId: 'ux/billing/disclosure', route: '/settings/billing', legal: ['LEG-STRIPE-001', 'LEG-STRIPE-003'], flow: 'billing-subscription' },
  { nodeId: 'ux/checkout/success-verify', route: '/checkout/success', legal: ['LEG-EDGE-006'], flow: 'billing-race-shield' },
  { nodeId: 'ux/danger/delete-copy', route: '/settings/danger', legal: ['LEG-DATA-001', 'LEG-DATA-003'], flow: 'account-deletion' },
  { nodeId: 'ux/export/download-ttl', route: '/settings/export', legal: ['LEG-DATA-004'], flow: 'data-export' },
  { nodeId: 'ux/legal/reaccept', route: '/legal/reaccept', legal: ['LEG-TERMS-005'], flow: 'terms-reaccept' },
  { nodeId: 'ux/onboarding/consent', route: '/onboarding', legal: ['LEG-COOKIE-001', 'LEG-PRIV-001'], flow: 'onboarding' },
  { nodeId: 'ux/forgot-password/rate-limit', route: '/forgot-password', legal: ['LEG-EDGE-003'], flow: 'password-reset' },
  { nodeId: 'ux/terms/public', route: '/terms', legal: ['LEG-GLOBAL-002'], flow: 'auth-lifecycle' },
  { nodeId: 'ux/privacy/public', route: '/privacy', legal: ['LEG-GLOBAL-001'], flow: 'auth-lifecycle' },
  { nodeId: 'ux/email/footer-can-spam', route: 'email:template/marketing', legal: ['LEG-EMAIL-001', 'LEG-EMAIL-003'], flow: 'email-lifecycle' },
];

const existingIds = new Set(em0.nodes.map((n) => n.nodeId));
const extra = [];

function push(node) {
  if (existingIds.has(node.nodeId)) return;
  existingIds.add(node.nodeId);
  extra.push({ ...node, type: 'flow_step', em1: true });
}

for (const m of MODULES) {
  for (const phase of ['TEST', 'VERIFY', 'SECURITY']) {
    push({
      nodeId: `step/${m.moduleId}/${phase.toLowerCase()}`,
      host: phase === 'SECURITY' && m.moduleId.includes('stripe-webhook') ? 'stripe' : m.host,
      route: m.route,
      phase,
      moduleIds: [m.moduleId],
      requiredForFlows: [m.flow],
      securityEffects: phase === 'SECURITY' ? m.security : [],
      legalEffects: phase === 'SECURITY' ? (m.legal ?? []) : [],
      agentGuidance: `${phase} gate for ${m.moduleId}`,
      referenceRefIds: m.refs ?? [],
    });
  }
  if (m.legal?.length) {
    for (const phase of ['COMPLIANCE', 'COMPLIANCE_AUDIT']) {
      push({
        nodeId: `step/${m.moduleId}/${phase.toLowerCase()}`,
        host: 'ironclad',
        route: m.route,
        phase,
        moduleIds: [m.moduleId],
        requiredForFlows: [m.flow],
        securityEffects: [],
        legalEffects: m.legal,
        agentGuidance:
          phase === 'COMPLIANCE'
            ? `T12 map obligations for ${m.moduleId}`
            : `T14 audit legal readiness for ${m.moduleId}`,
        referenceRefIds: m.refs ?? [],
      });
    }
  }
  if (GOLDEN_12.has(m.moduleId)) {
    push({
      nodeId: `step/${m.moduleId}/attestation`,
      host: m.host,
      route: m.route,
      phase: 'ATTESTATION',
      moduleIds: [m.moduleId],
      requiredForFlows: [m.flow],
      securityEffects: [],
      legalEffects: [],
      agentGuidance: 'Human or agent attestation before next module',
      referenceRefIds: m.refs ?? [],
    });
  }
}

for (const g of FLOW_GATES) {
  push({
    ...g,
    host: 'ironcannon',
    route: `/flow/${g.flow}`,
    moduleIds: [],
    requiredForFlows: [g.flow],
    securityEffects: [],
    legalEffects: [],
    referenceRefIds: ['ironcannon/verify-mandate'],
  });
}

for (const p of RESUME.paths) {
  push({
    nodeId: `resume/${p.id}`,
    host: 'ironcannon',
    route: `/resume/${p.id}`,
    phase: 'RESUME',
    moduleIds: [],
    requiredForFlows: [p.mode ?? 'FULL'],
    securityEffects: [],
    legalEffects: [],
    agentGuidance: p.expect ?? `Resume path ${p.id}`,
    referenceRefIds: [],
  });
}

for (const a of ARMOR) {
  push({ ...a, host: 'cloudflare', route: '/armor', securityEffects: ['armor_overlay'], legalEffects: [], referenceRefIds: [] });
}

for (const u of UX_ROUTES) {
  push({
    ...u,
    host: 'nextjs',
    phase: 'UX_COMPLIANCE',
    moduleIds: ['M04-auth-ui-routes'],
    securityEffects: [],
    legalEffects: u.legal,
    agentGuidance: `UX compliance slice ${u.route}`,
    referenceRefIds: ['legal/wcag-alt-text'],
  });
}

const merged = {
  rulesetVersion: em0.rulesetVersion,
  nodeCount: em0.nodes.length + extra.length,
  em0Count: em0.nodes.length,
  em1Count: extra.length,
  target: 200,
  nodes: [...em0.nodes, ...extra],
};

writeFileSync(
  join(ROOT, 'docs/engine/planning/em1-flow-steps.json'),
  JSON.stringify(merged, null, 2) + '\n',
);
console.log(`✓ EM-1 flow steps — ${merged.nodeCount} total (target ${merged.target})`);
