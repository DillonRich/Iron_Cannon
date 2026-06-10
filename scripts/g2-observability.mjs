#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';
import { validateApiKey } from '../packages/mcp-core/src/api-key.js';

const t01 = await invokeTool('T01', {
  fixtureId: 'SD-01',
  requestId: 'test-req-obs-001',
});
const tel = t01.meta?.telemetry;
if (!tel?.requestId || tel.requestId !== 'test-req-obs-001') {
  console.error('telemetry requestId', tel);
  process.exit(1);
}
if (typeof tel.durationMs !== 'number' || tel.durationMs < 0) {
  console.error('telemetry durationMs', tel);
  process.exit(1);
}
if (!tel.rulesetVersion) {
  console.error('telemetry rulesetVersion missing');
  process.exit(1);
}

const badKey = await validateApiKey({ apiKey: 'not-a-key' });
if (badKey.ok || badKey.error !== 'AUTH_INVALID') {
  console.error('AUTH_INVALID expected', badKey);
  process.exit(1);
}

const goodKey = await validateApiKey({ apiKey: 'ic_dev_pro_testkey12345678' });
if (!goodKey.ok || goodKey.tier !== 'pro' || goodKey.keySource !== 'registry') {
  console.error('valid dev key', goodKey);
  process.exit(1);
}

console.log('✓ g2-observability — telemetry + API key format');
process.exit(0);
