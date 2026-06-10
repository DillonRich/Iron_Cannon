#!/usr/bin/env node
import {
  recordToolUsage,
  flushUsageBufferToD1,
  getPendingUsageCount,
  resetUsageBufferForTests,
} from '../packages/mcp-core/src/usage-telemetry.js';

resetUsageBufferForTests();

const inserts = [];
const d1 = {
  prepare: (sql) => ({
    bind: (...args) => ({
      run: async () => {
        inserts.push({ sql, args });
        return { success: true };
      },
    }),
  }),
};

await recordToolUsage({ clientId: 'flush-user', toolId: 'T02', tier: 'pro', ok: true }, { d1, defer: true });
await recordToolUsage({ clientId: 'flush-user', toolId: 'T03', tier: 'pro', ok: true }, { d1, defer: true });

if (getPendingUsageCount() !== 2) {
  console.error('expected 2 pending rows', getPendingUsageCount());
  process.exit(1);
}
if (inserts.length !== 0) {
  console.error('defer should not insert immediately');
  process.exit(1);
}

const r = await flushUsageBufferToD1(d1);
if (!r.ok || r.flushed !== 2 || getPendingUsageCount() !== 0) {
  console.error('flush result', r, 'pending', getPendingUsageCount());
  process.exit(1);
}
if (inserts.length !== 2) {
  console.error('expected 2 D1 inserts', inserts.length);
  process.exit(1);
}

const again = await flushUsageBufferToD1(d1);
if (again.flushed !== 0) {
  console.error('second flush should be empty', again);
  process.exit(1);
}

console.log('✓ g2-usage-flush — defer + batch flush to D1');
process.exit(0);
