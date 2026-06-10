#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';
import {
  getUsageBufferSnapshot,
  resetUsageBufferForTests,
} from '../packages/mcp-core/src/usage-telemetry.js';

resetUsageBufferForTests();
process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';

await invokeTool('T01', { fixtureId: 'SD-01', tier: 'pro', clientKey: 'usage-test' });
await new Promise((r) => setTimeout(r, 5));
const buf = getUsageBufferSnapshot();
if (buf.length < 1 || buf[0].toolId !== 'T01') {
  console.error('usage buffer', buf);
  process.exit(1);
}

console.log(`✓ g2-usage-telemetry — recorded ${buf.length} event(s)`);
process.exit(0);
