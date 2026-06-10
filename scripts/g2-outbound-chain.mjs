#!/usr/bin/env node
/** T04 golden outbound chain — all 16 modules via mcp-core */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { invokeTool } from '../packages/mcp-core/src/index.js';

const t03 = await invokeTool('T03', { flowIds: ['auth-lifecycle', 'billing-subscription'] });
const att = t03.wiremapAttestation;
if (!att?.token) {
  console.error('T03 attestation missing');
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundle = JSON.parse(
  readFileSync(
    join(ROOT, 'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json'),
    'utf8',
  ),
);
const errors = [];
const order = bundle.moduleOrder ?? [];

for (let i = 0; i < order.length; i++) {
  const moduleId = order[i];
  const mod = bundle.modules[moduleId];
  const r = await invokeTool('T04', {
    moduleId,
    tier: 'pro',
    wiremapAttestation: att,
    completedModules: order.slice(0, i),
  });
  if (!r.ok) {
    errors.push(`${moduleId}: invoke failed`);
    continue;
  }
  const wantNext = i < order.length - 1 ? order[i + 1] : null;
  if (r.slice?.outbound?.nextModuleId !== wantNext) {
    errors.push(`${moduleId}: next ${r.slice?.outbound?.nextModuleId} want ${wantNext}`);
  }
}

if (errors.length) {
  console.error('G-2 outbound chain:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`✓ G-2 outbound chain — ${order.length} modules T04 pro`);
process.exit(0);
