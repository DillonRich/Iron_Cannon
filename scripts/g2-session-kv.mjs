#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';
import { resetSessionStoreForTests } from '../packages/mcp-core/src/session-attestation.js';

resetSessionStoreForTests();
process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';

const store = new Map();
const sessionKv = {
  async get(key) {
    return store.get(key) ?? null;
  },
  async put(key, value) {
    store.set(key, value);
  },
};

const client = 'kv-client-1';

const t03 = await invokeTool('T03', { tier: 'pro', clientKey: client, sessionKv });
if (!t03.wiremapAttestation?.token) {
  console.error('T03 no attestation');
  process.exit(1);
}
if (!store.has(`ic:att:${client}`)) {
  console.error('KV not written');
  process.exit(1);
}

resetSessionStoreForTests();

const t04 = await invokeTool('T04', {
  tier: 'pro',
  clientKey: client,
  moduleId: 'M01-auth-d1-schema',
  sessionKv,
});
if (!t04.ok) {
  console.error('T04 should resolve attestation from KV', t04);
  process.exit(1);
}

console.log('✓ g2-session-kv — KV-backed wiremap attestation across memory reset');
process.exit(0);
