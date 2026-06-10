#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const matrix = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json'), 'utf8'),
);
const registry = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);
const protoIds = new Set(registry.protocols.map((p) => p.protocolId));

const failures = [];
const requiredFlows = ['auth-lifecycle', 'billing-subscription'];

for (const fid of requiredFlows) {
  if (!matrix.flows.some((f) => f.flowId === fid)) failures.push(`missing flow ${fid}`);
}

for (const flow of matrix.flows ?? []) {
  for (const [svc, cfg] of Object.entries(flow.scopeServices ?? {})) {
    for (const pid of cfg.protocolIds ?? []) {
      if (!protoIds.has(pid)) failures.push(`${flow.flowId}/${svc}: unknown protocol ${pid}`);
    }
  }
}

if (failures.length) {
  console.error('Per-flow scope matrix failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Per-flow scope matrix — ${matrix.flowCount} flows`);
process.exit(0);
