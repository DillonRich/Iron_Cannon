#!/usr/bin/env node
/** EM-1 cross-links — legal + email compliance refIds → golden flows (wave 65) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const ids = new Set(em1.nodes.map((n) => n.nodeId));

const LINKS = [
  { flow: 'auth-lifecycle', ref: 'legal/cookie-consent-eu', phase: 'COMPLIANCE' },
  { flow: 'account-settings', ref: 'legal/privacy-policy-link', phase: 'COMPLIANCE' },
  { flow: 'email-lifecycle', ref: 'legal/can-spam-unsubscribe', phase: 'COMPLIANCE' },
  { flow: 'auth-lifecycle', ref: 'legal/ccpa-overview', phase: 'COMPLIANCE' },
  { flow: 'auth-lifecycle', ref: 'legal/coppa-overview', phase: 'COMPLIANCE' },
  { flow: 'auth-lifecycle', ref: 'legal/ai-disclosure', phase: 'COMPLIANCE' },
  { flow: 'data-export', ref: 'legal/eu-transfer-mechanism', phase: 'COMPLIANCE' },
  { flow: 'incident-response', ref: 'legal/status-page-link', phase: 'OPERATIONS' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-content-security-policy-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'email-lifecycle', ref: 'resend/domains-verify', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'stripe/customer-portal', phase: 'COMPLIANCE' },
  { flow: 'data-export', ref: 'legal/gdpr-data-subject-rights', phase: 'COMPLIANCE' },
];

const extra = [];
for (const { flow, ref, phase } of LINKS) {
  const slug = ref.split('/').slice(1).join('-');
  const nodeId = `lattice/w65/${ref.replace(/\//g, '-')}/${flow}`;
  if (ids.has(nodeId)) continue;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'flow_step',
    em1: true,
    lattice: 'wave65-legal',
    host: ref.split('/')[0],
    route: `/compliance/${slug}`,
    phase,
    moduleIds: [],
    requiredForFlows: [flow],
    agentGuidance: `Apply ${slug} controls on ${flow}`,
    referenceRefIds: [ref],
    obligationHint: 'LEG-W65',
  });
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 wave 65 legal links — +${extra.length} → ${em1.nodeCount} nodes`);
