#!/usr/bin/env node
import { resolveError } from '../packages/mcp-core/src/errors.js';
import { readEngineJson } from '../packages/mcp-core/src/engine-data.js';

const catalog = readEngineJson('planning/error-code-harness.json');
const errors = [];

for (const row of catalog.codes ?? []) {
  const got = resolveError(row.trigger);
  if (got !== row.expect) errors.push(`${row.code}: got ${got}`);
}

if (errors.length) {
  console.error('G-2 error catalog:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`✓ G-2 error catalog — ${catalog.codes.length} codes via resolveError`);
process.exit(0);
