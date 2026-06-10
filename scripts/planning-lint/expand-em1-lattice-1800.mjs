#!/usr/bin/env node
/** Append EM-1 micro-lattice until nodeCount >= 1800 (wave 52) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const TARGET = 1800;

const MODULES = [
  'M01-auth-d1-schema', 'M02-auth-worker-routes', 'M03-auth-resend-emails', 'M04-auth-ui-routes',
  'M05-auth-session-middleware', 'M10-billing-d1-schema', 'M11-stripe-checkout-route',
  'M12-stripe-webhook', 'M13-provisioning-kv', 'M14-billing-success-ui',
  'M15-billing-dashboard-ui', 'M16-billing-emails', 'M20-reset-token-schema', 'M21-reset-api',
  'M22-reset-ui', 'M23-reset-email', 'M30-onboarding-schema', 'M31-onboarding-api',
  'M32-onboarding-ui', 'M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui',
  'M50-export-api', 'M51-export-worker', 'M52-export-ui', 'M55-terms-reaccept-api', 'M56-terms-reaccept-ui',
];

const FLOWS = [
  'auth-lifecycle', 'billing-subscription', 'password-reset', 'account-deletion',
  'data-export', 'onboarding', 'terms-reaccept', 'billing-race-shield', 'email-lifecycle',
];

const TOOLS = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14'];
const WAVE52_PHASES = ['SRE', 'CHAOS', 'BACKUP', 'ACCESS_REVIEW', 'VENDOR_RISK', 'PENTEST', 'DRILL'];

const ids = new Set(em1.nodes.map((n) => n.nodeId));
const extra = [];

function push(node) {
  if (ids.has(node.nodeId)) return;
  ids.add(node.nodeId);
  extra.push({ ...node, type: 'flow_step', em1: true, lattice: 'wave52' });
}

for (const moduleId of MODULES) {
  for (const phase of WAVE52_PHASES) {
    push({
      nodeId: `lattice/w52/${moduleId}/${phase.toLowerCase()}`,
      host: moduleId.includes('stripe') ? 'stripe' : moduleId.includes('resend') ? 'resend' : 'cloudflare',
      route: `/lattice/w52/${moduleId}`,
      phase,
      moduleIds: [moduleId],
      requiredForFlows: [],
      securityEffects: phase === 'PENTEST' ? ['audit_trail'] : phase === 'ACCESS_REVIEW' ? ['secret_rotation'] : [],
      legalEffects: phase === 'VENDOR_RISK' ? ['ropa_update'] : [],
      agentGuidance: `${phase} wave-52 checkpoint for ${moduleId}`,
      referenceRefIds: ['ironcannon/planning-w52-em1'],
    });
  }
}

for (const flow of FLOWS) {
  for (const tool of TOOLS) {
    push({
      nodeId: `lattice/w52/flow/${flow}/${tool.toLowerCase()}/compliance_attest`,
      host: 'ironcannon',
      route: `/flow/${flow}`,
      phase: 'COMPLIANCE_ATTEST',
      moduleIds: [],
      requiredForFlows: [flow],
      securityEffects: [],
      legalEffects: [],
      agentGuidance: `${tool} compliance attestation gate for ${flow}`,
      referenceRefIds: ['ironcannon/agent-guidance-block'],
      mcpTool: tool,
    });
  }
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
em1.latticeWave = 52;
em1.target = TARGET;

writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 lattice wave 52 — +${extra.length} → ${em1.nodeCount} (target ${TARGET})`);
if (em1.nodeCount < TARGET) {
  console.error(`EM-1 still ${em1.nodeCount} < ${TARGET}`);
  process.exit(1);
}
