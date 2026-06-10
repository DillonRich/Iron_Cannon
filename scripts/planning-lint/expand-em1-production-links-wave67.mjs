#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const ids = new Set(em1.nodes.map((n) => n.nodeId));

const LINKS = [
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-mcp-security-cheat-sheet-html', phase: 'SECURITY_AUDIT' },
  { flow: 'billing-subscription', ref: 'owasp/cheatsheets-rag-security-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-ai-agent-security-cheat-sheet-html', phase: 'SECURITY_AUDIT' },
  { flow: 'auth-lifecycle', ref: 'cloudflare/workers-secrets', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'stripe/disputes-prevention-best-practices', phase: 'COMPLIANCE' },
  { flow: 'email-lifecycle', ref: 'resend/webhooks', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'nextjs/docs-app-guides-data-security', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'legal/refund-policy-disclosure', phase: 'COMPLIANCE' },
  { flow: 'security-audit', ref: 'ironcannon/knowledge-w63-t10-before-t11', phase: 'SECURITY_AUDIT' },
  { flow: 'security-audit', ref: 'ironcannon/knowledge-w67-production-confidence-gate', phase: 'OPERATIONS' },
  { flow: 'billing-subscription', ref: 'stripe/disputes-api', phase: 'COMPLIANCE' },
  { flow: 'module-loop', ref: 'ironcannon/knowledge-w67-phase3-expand-test', phase: 'OPERATIONS' },
];

const extra = [];
for (const { flow, ref, phase } of LINKS) {
  const slug = ref.split('/').slice(1).join('-');
  const nodeId = `lattice/w67/${ref.replace(/\//g, '-')}/${flow}`;
  if (ids.has(nodeId)) continue;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'flow_step',
    em1: true,
    lattice: 'wave67-production',
    host: ref.split('/')[0],
    route: `/production/${slug}`,
    phase,
    moduleIds: [],
    requiredForFlows: [flow],
    agentGuidance: `Apply ${slug} on ${flow}`,
    referenceRefIds: [ref],
    obligationHint: 'LEG-W67',
  });
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 wave 67 production links — +${extra.length} → ${em1.nodeCount} nodes`);
