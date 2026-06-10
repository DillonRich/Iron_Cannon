#!/usr/bin/env node
/** EM-1 cross-links — Stripe + Cloudflare refIds → golden flows (wave 64) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const ids = new Set(em1.nodes.map((n) => n.nodeId));

const LINKS = [
  { flow: 'billing-subscription', ref: 'stripe/webhook-signature', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'stripe/radar-fraud', phase: 'COMPLIANCE' },
  { flow: 'billing-subscription', ref: 'stripe/idempotency', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'stripe/test-mode-block', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'cloudflare/turnstile', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'cloudflare/waf-overview', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'cloudflare/workers-runtime-apis-bindings-rate-limit-index', phase: 'SECURITY' },
  { flow: 'data-export', ref: 'legal/gdpr-data-subject-rights', phase: 'COMPLIANCE' },
  { flow: 'billing-subscription', ref: 'cloudflare/d1-migrations', phase: 'SECURITY' },
  { flow: 'email-lifecycle', ref: 'resend/webhooks', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-logging-cheat-sheet-html', phase: 'SECURITY_AUDIT' },
  { flow: 'billing-subscription', ref: 'stripe/webhooks', phase: 'SECURITY' },
];

const extra = [];
for (const { flow, ref, phase } of LINKS) {
  const slug = ref.split('/').slice(1).join('-');
  const nodeId = `lattice/w64/${ref.replace(/\//g, '-')}/${flow}`;
  if (ids.has(nodeId)) continue;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'flow_step',
    em1: true,
    lattice: 'wave64-stripe-cf',
    host: ref.split('/')[0],
    route: `/security/${slug}`,
    phase,
    moduleIds: [],
    requiredForFlows: [flow],
    agentGuidance: `Apply ${slug} controls on ${flow}`,
    referenceRefIds: [ref],
    obligationHint: 'LEG-W64',
  });
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 wave 64 Stripe/CF links — +${extra.length} → ${em1.nodeCount} nodes`);
