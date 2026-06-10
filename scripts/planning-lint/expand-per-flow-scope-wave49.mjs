#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json');
const matrix = JSON.parse(readFileSync(path, 'utf8'));

const registry = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);
const EXTRA = [
  'owasp/logging-pii',
  'generic/audit-log-auth',
  registry.protocols.find((p) => p.protocolId.startsWith('planning/sp49-stripe-'))?.protocolId,
  registry.protocols.find((p) => p.protocolId.startsWith('planning/sp49-owasp-'))?.protocolId,
].filter(Boolean);

for (const flow of matrix.flows) {
  for (const svc of Object.keys(flow.scopeServices ?? {})) {
    const entry = flow.scopeServices[svc];
    const ids = new Set(entry.protocolIds ?? []);
    for (const pid of EXTRA) ids.add(pid);
    entry.protocolIds = [...ids];
  }
}

writeFileSync(path, JSON.stringify(matrix, null, 2) + '\n');
console.log(`✓ Per-flow scope matrix — ${matrix.flows.length} flows enriched`);
