#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';

const errors = [];
for (let i = 0; i < 35; i++) {
  const r = await invokeTool('T01', { fixtureId: 'SD-01', tier: 'pro', clientKey: 'test-rl' });
  if (r.error === 'RATE_LIMIT_EXCEEDED') {
    if (i < 30) errors.push(`rate limit too early at ${i}`);
    console.log(`✓ G-2 rate limit — tripped after ${i + 1} requests`);
    process.exit(errors.length ? 1 : 0);
  }
}
errors.push('never tripped pro 30/min limit');
console.error(errors.join('\n'));
process.exit(1);
