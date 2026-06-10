#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';

const blocked = await invokeTool('T04', { moduleId: 'M01-auth-d1-schema', tier: 'pro' });
if (blocked.ok || blocked.error !== 'WIREMAP_NOT_APPROVED') {
  console.error('expected WIREMAP_NOT_APPROVED', blocked);
  process.exit(1);
}

const t03 = await invokeTool('T03', { tier: 'pro' });
const att = t03.wiremapAttestation;
const ok = await invokeTool('T04', {
  moduleId: 'M12-stripe-webhook',
  tier: 'pro',
  wiremapAttestation: att,
});
if (!ok.ok) {
  console.error('T04 with attestation failed', ok);
  process.exit(1);
}

const badModule = await invokeTool('T04', {
  moduleId: 'M99-fake-module',
  tier: 'pro',
  wiremapAttestation: att,
});
if (badModule.ok || badModule.error !== 'WIREMAP_MODULE_MISMATCH') {
  console.error('expected WIREMAP_MODULE_MISMATCH for out-of-wiremap module', badModule);
  process.exit(1);
}

console.log('✓ g2-wiremap-gate — blocks without attestation, passes with T03 token');
process.exit(0);
