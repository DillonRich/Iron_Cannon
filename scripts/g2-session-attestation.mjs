#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';
import {
  getWiremapAttestation,
  resetSessionStoreForTests,
} from '../packages/mcp-core/src/session-attestation.js';

resetSessionStoreForTests();
process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';

const client = 'session-test-client';

const t03 = await invokeTool('T03', { tier: 'pro', clientKey: client });
const stored = getWiremapAttestation(client);
if (!stored?.token || stored.token !== t03.wiremapAttestation?.token) {
  console.error('session store after T03 failed');
  process.exit(1);
}

const t04 = await invokeTool('T04', {
  tier: 'pro',
  clientKey: client,
  moduleId: 'M01-auth-d1-schema',
});
if (!t04.ok) {
  console.error('T04 without explicit attestation should use session', t04);
  process.exit(1);
}

console.log('✓ g2-session-attestation — T03 stores, T04 recalls by clientKey');
process.exit(0);
