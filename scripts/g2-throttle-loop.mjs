#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';
import { resetThrottleGuardForTests } from '../packages/mcp-core/src/throttle-guard.js';

process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';
resetThrottleGuardForTests();

const att = { approved: true, token: 't', moduleIds: ['M12-stripe-webhook'] };
let blocked = null;
for (let i = 0; i < 8; i++) {
  const r = await invokeTool('T05', {
    moduleId: 'M12-stripe-webhook',
    tier: 'pro',
    clientKey: 'throttle-test-client',
    wiremapAttestation: att,
  });
  if (!r.ok && r.error === 'THROTTLE_LOOP_DETECTED') {
    blocked = r;
    break;
  }
}
if (!blocked) {
  console.error('expected THROTTLE_LOOP_DETECTED after repeated T05');
  process.exit(1);
}
console.log('✓ g2-throttle-loop — THROTTLE_LOOP_DETECTED enforced');
process.exit(0);
