#!/usr/bin/env node
/** T05 fixture calibration — pass/fail snippets (not invokeTool audit path). */
process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';
import { readEngineJson } from '../packages/mcp-core/src/engine-data.js';
import { verifyModuleCompliance } from '../packages/mcp-core/src/t05-verify.js';
import { loadModuleFixture } from '../packages/mcp-core/src/load-fixture.js';

const bundle = readEngineJson('specimens/fixtures/e2e/golden-path-outbound.bundle.json');
const errors = [];

for (const moduleId of bundle.moduleOrder ?? []) {
  const spec = loadModuleFixture(moduleId);
  if (!spec) {
    errors.push(`${moduleId}: no fixture`);
    continue;
  }
  const cal = verifyModuleCompliance(spec);
  if (!cal.compliant) errors.push(`${moduleId}: calibration compliant=${cal.compliant}`);
}

if (errors.length) {
  console.error('G-2 T05 golden:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`✓ G-2 T05 golden — ${bundle.moduleOrder.length} module fixtures calibrated`);
process.exit(0);
