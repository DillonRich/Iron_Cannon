#!/usr/bin/env node
/** Full golden E2E through @ironcannon/mcp-core (packages are SSOT). */
import { readEngineJson } from '../packages/mcp-core/src/engine-data.js';
import { invokeTool } from '../packages/mcp-core/src/index.js';

const errors = [];
const bundle = readEngineJson('specimens/fixtures/e2e/golden-path-outbound.bundle.json');
const manifest = readEngineJson('phase1/rules-manifest.json');

const t01 = await invokeTool('T01', { fixtureId: 'SD-01' });
if (!t01.ok || !t01.stack?.supported) errors.push('T01 SD-01');

const t02 = await invokeTool('T02', { stack: t01.stack });
if (!t02.ok || !t02.complete) errors.push('T02 incomplete');

const t03 = await invokeTool('T03', { flowIds: ['auth-lifecycle', 'billing-subscription'] });
const ids = t03.wiremaps?.[0]?.moduleIds ?? [];
if (!t03.ok || ids.length !== 12 || t03.split) errors.push('T03 wiremap');
if (!t03.wiremapAttestation?.token) errors.push('T03 attestation');

const att = t03.wiremapAttestation;
const order = bundle.moduleOrder ?? [];
for (const moduleId of order) {
  if (!manifest.modules[moduleId]) errors.push(`manifest ${moduleId}`);
  const t04 = await invokeTool('T04', { moduleId, tier: 'pro', wiremapAttestation: att });
  if (!t04.ok) errors.push(`T04 ${moduleId}`);
  if (!t04.meta?.telemetry?.requestId) errors.push(`T04 telemetry ${moduleId}`);
  const t05 = await invokeTool('T05', { moduleId, wiremapAttestation: att });
  if (!t05.ok || !t05.compliant) errors.push(`T05 ${moduleId} compliant=${t05.compliant}`);
}

const t11 = await invokeTool('T11', {
  tier: 'armor',
  wiremapContext: { completedModules: order },
  wiremapAttestation: att,
});
if (!t11.ok) errors.push('T11 armor');

if (errors.length) {
  console.error('G-2 E2E packages FAILED:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`✓ G-2 E2E packages — T01→T03(12)→T04/T05×${order.length} (${bundle.chainId})`);
process.exit(0);
