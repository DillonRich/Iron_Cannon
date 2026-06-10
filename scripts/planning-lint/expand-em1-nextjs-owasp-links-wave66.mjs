#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const ids = new Set(em1.nodes.map((n) => n.nodeId));

const LINKS = [
  { flow: 'auth-lifecycle', ref: 'nextjs/middleware', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'nextjs/server-actions', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-cross-site-scripting-prevention-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'owasp/cheatsheets-deserialization-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'module-loop', ref: 'ironcannon/knowledge-w61-t05-before-t04-next', phase: 'OPERATIONS' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-http-headers-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-session-management-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'owasp/cheatsheets-rest-security-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'auth-lifecycle', ref: 'owasp/cheatsheets-error-handling-cheat-sheet-html', phase: 'SECURITY' },
  { flow: 'data-export', ref: 'ironcannon/compare-engine', phase: 'COMPLIANCE' },
  { flow: 'auth-lifecycle', ref: 'nextjs/docs-app-building-your-application-routing-middleware', phase: 'SECURITY' },
  { flow: 'billing-subscription', ref: 'ironcannon/knowledge-w66-tgs-v2-obligation-floor', phase: 'COMPLIANCE' },
];

const extra = [];
for (const { flow, ref, phase } of LINKS) {
  const slug = ref.split('/').slice(1).join('-');
  const nodeId = `lattice/w66/${ref.replace(/\//g, '-')}/${flow}`;
  if (ids.has(nodeId)) continue;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'flow_step',
    em1: true,
    lattice: 'wave66-nextjs-owasp',
    host: ref.split('/')[0],
    route: `/security/${slug}`,
    phase,
    moduleIds: [],
    requiredForFlows: [flow],
    agentGuidance: `Apply ${slug} on ${flow}`,
    referenceRefIds: [ref],
    obligationHint: 'LEG-W66',
  });
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 wave 66 Next.js/OWASP links — +${extra.length} → ${em1.nodeCount} nodes`);
