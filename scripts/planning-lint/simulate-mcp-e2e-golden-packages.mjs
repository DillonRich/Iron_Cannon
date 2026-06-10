#!/usr/bin/env node
/**
 * MCP E2E golden path — packages SSOT (runs alongside planning proof).
 */
import { invokeTool } from './lib/mcp-invoke.mjs';
import { readEngineJson } from '../../packages/mcp-core/src/engine-data.js';

const errors = [];
const bundle = readEngineJson('specimens/fixtures/e2e/golden-path-outbound.bundle.json');

const t01 = await invokeTool('T01', { fixtureId: 'SD-01' });
if (!t01.ok || !t01.stack?.supported) errors.push('T01');

const t02 = await invokeTool('T02', { stack: t01.stack });
if (!t02.ok || !t02.complete) errors.push('T02');

const t03 = await invokeTool('T03', { flowIds: ['auth-lifecycle', 'billing-subscription'] });
if ((t03.wiremaps?.[0]?.moduleIds?.length ?? 0) !== 12) errors.push('T03');

const att = t03.wiremapAttestation;
for (const moduleId of bundle.moduleOrder ?? []) {
  const t04 = await invokeTool('T04', { moduleId, tier: 'pro', wiremapAttestation: att });
  const t05 = await invokeTool('T05', { moduleId, wiremapAttestation: att });
  if (!t04.ok) errors.push(`T04 ${moduleId}`);
  if (!t05.ok || !t05.compliant) errors.push(`T05 ${moduleId}`);
}

if (errors.length) {
  console.error('MCP E2E packages failures:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`✓ MCP E2E packages — ${bundle.moduleOrder.length} modules via mcp-core`);
process.exit(0);
