#!/usr/bin/env node
import { validateApiKey, lookupDevRegistry } from '../packages/mcp-core/src/api-key.js';

const errors = [];

const reg = lookupDevRegistry('ic_dev_armor_armortest12345678');
if (!reg?.ok || reg.tier !== 'armor' || reg.source !== 'registry') {
  errors.push('dev registry armor key');
}

const fmt = await validateApiKey({ apiKey: 'ic_dev_pro_testkey12345678' });
if (!fmt.ok || fmt.tier !== 'pro' || fmt.keySource !== 'registry') {
  errors.push('validate registry', fmt);
}

const bad = await validateApiKey({ apiKey: 'bad-key' });
if (bad.ok || bad.error !== 'AUTH_INVALID') errors.push('invalid key');

const miss = await validateApiKey({}, { requireApiKey: true });
if (miss.ok || miss.error !== 'AUTH_MISSING') errors.push('missing key');

const d1mock = {
  prepare: () => ({
    bind: () => ({
      first: async () => ({ tier: 'ironclad', userId: 'user-abc' }),
    }),
  }),
};
const d1 = await validateApiKey(
  { apiKey: 'ic_live_ironclad_d1mocktest1234' },
  { d1: d1mock },
);
if (!d1.ok || d1.tier !== 'ironclad' || d1.keySource !== 'd1') errors.push('d1 mock', d1);

if (errors.length) {
  console.error('G-2 API keys:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✓ G-2 API keys — dev registry + D1 stub + format fallback');
process.exit(0);
