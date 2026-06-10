#!/usr/bin/env node
/** EM-1 cross-links — OWASP cheatsheet refIds → golden flows (wave 63) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const ids = new Set(em1.nodes.map((n) => n.nodeId));

const LINKS = [
  { flow: 'auth-lifecycle', owasp: 'owasp/cheatsheets-cross-site-request-forgery-prevention-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', owasp: 'owasp/cheatsheets-session-management-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', owasp: 'owasp/cheatsheets-forgot-password-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', owasp: 'owasp/cheatsheets-multifactor-authentication-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'billing-subscription', owasp: 'owasp/cheatsheets-third-party-payment-gateway-integration-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'billing-subscription', owasp: 'owasp/cheatsheets-transaction-authorization-cheat-sheet-html', phase: 'COMPLIANCE' },
  { flow: 'email-lifecycle', owasp: 'owasp/cheatsheets-email-validation-and-verification-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'password-reset', owasp: 'owasp/cheatsheets-forgot-password-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'account-deletion', owasp: 'owasp/cheatsheets-user-privacy-protection-cheat-sheet-html', phase: 'COMPLIANCE' },
  { flow: 'data-export', owasp: 'owasp/cheatsheets-user-privacy-protection-cheat-sheet-html', phase: 'COMPLIANCE' },
  { flow: 'auth-lifecycle', owasp: 'owasp/cheatsheets-mcp-security-cheat-sheet-html', phase: 'SECURITY_AUDIT' },
  { flow: 'billing-subscription', owasp: 'owasp/cheatsheets-rest-security-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', owasp: 'owasp/cheatsheets-http-headers-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', owasp: 'owasp/cheatsheets-content-security-policy-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'billing-subscription', owasp: 'owasp/cheatsheets-credential-stuffing-prevention-cheat-sheet-html', phase: 'SECURITY' },
];

const extra = [];
for (const { flow, owasp, phase } of LINKS) {
  const slug = owasp.split('/')[1];
  const nodeId = `lattice/w63/owasp/${slug}/${flow}`;
  if (ids.has(nodeId)) continue;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'flow_step',
    em1: true,
    lattice: 'wave63-owasp',
    host: 'owasp',
    route: `/security/${slug}`,
    phase,
    moduleIds: [],
    requiredForFlows: [flow],
    agentGuidance: `Apply ${slug} controls on ${flow}`,
    referenceRefIds: [owasp],
    obligationHint: 'LEG-W63',
  });
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 wave 63 OWASP links — +${extra.length} → ${em1.nodeCount} nodes`);
