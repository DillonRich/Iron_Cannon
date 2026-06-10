#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const ids = new Set(em1.nodes.map((n) => n.nodeId));

const LINKS = [
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-abuse-case-cheat-sheet-html', phase: 'SECURITY_AUDIT' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-clickjacking-defense-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'module-loop', ref: 'owasp/cheatsheets-secure-coding-with-ai-cheat-sheet-html', phase: 'OPERATIONS' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-llm-prompt-injection-prevention-cheat-sheet-html', phase: 'SECURITY_AUDIT' },
  { flow: 'auth-lifecycle', ref: 'nextjs/docs-app-guides-authentication', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'stripe/customer-portal', phase: 'COMPLIANCE' },
  { flow: 'module-loop', ref: 'ironcannon/agent-guidance-block', phase: 'OPERATIONS' },
  { flow: 'security-audit', ref: 'ironcannon/knowledge-w68-adversarial-agent-gate', phase: 'OPERATIONS' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-cross-site-request-forgery-prevention-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'security-audit', ref: 'ironcannon/knowledge-w68-tier-tool-parity', phase: 'COMPLIANCE' },
  { flow: 'auth-lifecycle', ref: 'ironcannon/knowledge-w68-agent-guidance-required', phase: 'OPERATIONS' },
  { flow: 'billing-subscription', ref: 'ironcannon/knowledge-w68-adversarial-agent-gate', phase: 'OPERATIONS' },
];

const extra = [];
for (const { flow, ref, phase } of LINKS) {
  const slug = ref.split('/').slice(1).join('-');
  const nodeId = `lattice/w68/${ref.replace(/\//g, '-')}/${flow}`;
  if (ids.has(nodeId)) continue;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'flow_step',
    em1: true,
    lattice: 'wave68-adversarial',
    host: ref.split('/')[0],
    route: `/adversarial/${slug}`,
    phase,
    moduleIds: [],
    requiredForFlows: [flow],
    agentGuidance: `Apply ${slug} on ${flow}`,
    referenceRefIds: [ref],
    obligationHint: 'LEG-W68',
  });
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 wave 68 adversarial links — +${extra.length} → ${em1.nodeCount} nodes`);
