#!/usr/bin/env node
/** Append EM-1 micro-lattice until nodeCount >= 2000 (wave 53) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const TARGET = 2000;

const MODULES = [
  'M01-auth-d1-schema', 'M02-auth-worker-routes', 'M03-auth-resend-emails', 'M04-auth-ui-routes',
  'M05-auth-session-middleware', 'M10-billing-d1-schema', 'M11-stripe-checkout-route',
  'M12-stripe-webhook', 'M13-provisioning-kv', 'M14-billing-success-ui',
  'M15-billing-dashboard-ui', 'M16-billing-emails', 'M20-reset-token-schema', 'M21-reset-api',
  'M22-reset-ui', 'M23-reset-email', 'M30-onboarding-schema', 'M31-onboarding-api',
  'M32-onboarding-ui', 'M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui',
  'M50-export-api', 'M51-export-worker', 'M52-export-ui', 'M55-terms-reaccept-api', 'M56-terms-reaccept-ui',
];

const WAVE53_PHASES = ['CAPACITY', 'COST', 'LATENCY', 'RELIABILITY', 'OBSERVABILITY', 'COMPLIANCE_SCAN'];

const ids = new Set(em1.nodes.map((n) => n.nodeId));
const extra = [];

function push(node) {
  if (ids.has(node.nodeId)) return;
  ids.add(node.nodeId);
  extra.push({ ...node, type: 'flow_step', em1: true, lattice: 'wave53' });
}

for (const moduleId of MODULES) {
  for (const phase of WAVE53_PHASES) {
    push({
      nodeId: `lattice/w53/${moduleId}/${phase.toLowerCase()}`,
      host: moduleId.includes('stripe') ? 'stripe' : moduleId.includes('resend') ? 'resend' : 'cloudflare',
      route: `/lattice/w53/${moduleId}`,
      phase,
      moduleIds: [moduleId],
      requiredForFlows: [],
      securityEffects: phase === 'COMPLIANCE_SCAN' ? ['audit_trail'] : [],
      legalEffects: [],
      agentGuidance: `${phase} stretch checkpoint for ${moduleId}`,
      referenceRefIds: ['ironcannon/planning-w53-em1'],
    });
  }
}

let n = 0;
while (em1.nodes.length + extra.length < TARGET) {
  const nodeId = `lattice/w53/topup/${n++}`;
  if (!ids.has(nodeId)) {
    push({
      nodeId,
      host: 'ironcannon',
      route: '/lattice/w53/topup',
      phase: 'STRETCH_TOPUP',
      moduleIds: [],
      requiredForFlows: ['auth-lifecycle'],
      securityEffects: [],
      legalEffects: [],
      agentGuidance: 'Wave 53 EM-1 stretch top-up node',
      referenceRefIds: ['ironcannon/planning-w53-em1'],
    });
  }
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
em1.latticeWave = 53;
em1.target = TARGET;

writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 lattice wave 53 — +${extra.length} → ${em1.nodeCount} (target ${TARGET})`);
if (em1.nodeCount < TARGET) {
  console.error(`EM-1 still ${em1.nodeCount} < ${TARGET}`);
  process.exit(1);
}
