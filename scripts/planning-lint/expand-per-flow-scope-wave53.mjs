#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json');
const matrix = JSON.parse(readFileSync(path, 'utf8'));
const registry = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'));
const protoIds = new Set(registry.protocols.map((p) => p.protocolId));
const pid = registry.protocols.find((p) => p.protocolId.startsWith('planning/sp53-legal-'))?.protocolId;
if (pid && protoIds.has(pid)) {
  for (const flow of matrix.flows) {
    for (const svc of Object.values(flow.scopeServices ?? {})) {
      const ids = new Set(svc.protocolIds ?? []);
      ids.add(pid);
      svc.protocolIds = [...ids];
    }
  }
}
writeFileSync(path, JSON.stringify(matrix, null, 2) + '\n');
console.log(`✓ Per-flow scope wave 53 — ${matrix.flows.length} flows`);
