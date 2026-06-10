#!/usr/bin/env node
/** Append EM-1 micro-lattice until nodeCount >= 1500 (wave 51) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const em1 = JSON.parse(readFileSync(path, 'utf8'));
const TARGET = 1500;

const MODULES = [
  'M01-auth-d1-schema', 'M02-auth-worker-routes', 'M03-auth-resend-emails', 'M04-auth-ui-routes',
  'M05-auth-session-middleware', 'M10-billing-d1-schema', 'M11-stripe-checkout-route',
  'M12-stripe-webhook', 'M13-provisioning-kv', 'M14-billing-success-ui',
  'M15-billing-dashboard-ui', 'M16-billing-emails', 'M20-reset-token-schema', 'M21-reset-api',
  'M22-reset-ui', 'M23-reset-email', 'M30-onboarding-schema', 'M31-onboarding-api',
  'M32-onboarding-ui', 'M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui',
  'M50-export-api', 'M51-export-worker', 'M52-export-ui', 'M55-terms-reaccept-api', 'M56-terms-reaccept-ui',
];

const WAVE51_PHASES = ['RUNBOOK', 'INCIDENT', 'KEY_ROTATION', 'DATA_MAP'];

const ids = new Set(em1.nodes.map((n) => n.nodeId));
const extra = [];

function push(node) {
  if (ids.has(node.nodeId)) return;
  ids.add(node.nodeId);
  extra.push({ ...node, type: 'flow_step', em1: true, lattice: 'wave51' });
}

for (const moduleId of MODULES) {
  for (const phase of WAVE51_PHASES) {
    push({
      nodeId: `lattice/w51/${moduleId}/${phase.toLowerCase()}`,
      host: moduleId.includes('stripe') ? 'stripe' : moduleId.includes('resend') ? 'resend' : 'cloudflare',
      route: `/lattice/w51/${moduleId}`,
      phase,
      moduleIds: [moduleId],
      requiredForFlows: [],
      securityEffects: phase === 'KEY_ROTATION' ? ['secret_rotation'] : phase === 'INCIDENT' ? ['audit_trail'] : [],
      legalEffects: phase === 'DATA_MAP' ? ['ropa_update'] : [],
      agentGuidance: `${phase} planning checkpoint for ${moduleId}`,
      referenceRefIds: ['ironcannon/planning-quality-gates'],
    });
  }
}

em1.nodes = [...em1.nodes, ...extra];
em1.nodeCount = em1.nodes.length;
em1.latticeWave = 51;
em1.target = TARGET;

writeFileSync(path, JSON.stringify(em1, null, 2) + '\n');
console.log(`✓ EM-1 lattice wave 51 — +${extra.length} → ${em1.nodeCount} (target ${TARGET})`);
if (em1.nodeCount < TARGET) {
  console.error(`EM-1 still ${em1.nodeCount} < ${TARGET}`);
  process.exit(1);
}
