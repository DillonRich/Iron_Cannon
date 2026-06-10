#!/usr/bin/env node
process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';
import { invokeTool } from '../packages/mcp-core/src/index.js';

const errors = [];

const t09 = await invokeTool('T09', {
  tier: 'armor',
  surfaceHints: [{ type: 'webhook' }],
});
if (!t09.ok || !(t09.infrastructure?.length >= 6)) {
  errors.push(`T09 infra domains: ${t09.infrastructure?.length}`);
}
const t09filt = await invokeTool('T09', {
  tier: 'armor',
  infraHints: [{ type: 'cache' }],
});
if ((t09filt.infrastructure?.length ?? 0) < 1) errors.push('T09 infra filter');

const t10 = await invokeTool('T10', {
  tier: 'armor',
  domainId: 'INFRA-CACHE',
  expectedRps: 500,
  expectedUsers: 1_000_000,
});
if (!t10.ok || !t10.checklist?.length || !t10.directives?.length) {
  errors.push('T10 INFRA-CACHE directives');
}

const t11partial = await invokeTool('T11', {
  tier: 'armor',
  wiremapContext: { completedModules: ['M01-auth-d1-schema'] },
  autoConfirmInfra: false,
});
if (t11partial.infraReady) errors.push('T11 should block infra with one module');

const t11 = await invokeTool('T11', {
  tier: 'armor',
  wiremapContext: {
    completedModules: [
      'M01-auth-d1-schema',
      'M02-auth-worker-routes',
      'M05-auth-session-middleware',
      'M10-billing-d1-schema',
      'M11-stripe-checkout-route',
      'M12-stripe-webhook',
      'M13-provisioning-kv',
    ],
  },
  confirmedChecklistIds: [
    'cache-rules-explicit',
    'per-ip-limits',
    'rps-budget',
    'baseline-load-test',
  ],
});
if (!t11.ok || !t11.infrastructure?.domains) errors.push('T11 missing infrastructure block');

if (errors.length) {
  console.error('G-2 infrastructure smoke:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✓ G-2 infrastructure — T09 domains, T10 INFRA-CACHE, T11 gate');
process.exit(0);
