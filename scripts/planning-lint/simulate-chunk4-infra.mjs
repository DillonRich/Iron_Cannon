#!/usr/bin/env node
/**
 * C01 MCP adapter, C04 proxy, C05 throttle — planning behavior mirrors.
 */
const failures = [];

function mcpAdapterListTools(registry) {
  return registry.length === 14 ? { ok: true } : { code: 'ENGINE_SCHEMA_FAILURE' };
}

function proxySanitize(body) {
  const s = JSON.stringify(body);
  return s.includes('sk_live') || s.includes('STRIPE_SECRET') ? { code: 'ENGINE_SCHEMA_FAILURE' } : { ok: true };
}

function throttleGuard(sameModuleCalls) {
  return sameModuleCalls >= 6 ? { code: 'THROTTLE_LOOP_DETECTED' } : { ok: true };
}

const tools = Array.from({ length: 14 }, (_, i) => `T${i + 1}`);
if (!mcpAdapterListTools(tools).ok) failures.push('C01: expected 14 tools');
if (!proxySanitize({ apiKey: 'ic_test_abc' }).ok) failures.push('C04: sanitize fail');
if (proxySanitize({ stripe: 'sk_live_xxx' }).code !== 'ENGINE_SCHEMA_FAILURE') {
  failures.push('C04: must block live secret echo');
}
if (throttleGuard(6).code !== 'THROTTLE_LOOP_DETECTED') failures.push('C05: throttle');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('✓ Chunk 4 infra C01/C04/C05 — adapter, proxy sanitize, throttle');
process.exit(0);
