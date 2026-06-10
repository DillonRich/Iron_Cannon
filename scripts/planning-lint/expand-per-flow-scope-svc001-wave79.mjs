#!/usr/bin/env node
/** SVC-001 wave 79 — SD-06 stack profile in per-flow-scope matrix. */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json');
const matrix = JSON.parse(readFileSync(path, 'utf8'));

const registry = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);
const pagesProtocols = registry.protocols
  .filter((p) => p.protocolId.includes('w78-') || p.protocolId.includes('w79-'))
  .slice(0, 4)
  .map((p) => p.protocolId);

matrix.stackProfiles = {
  'SD-06': {
    label: 'Pages + Worker split (SVC-001)',
    prependedModules: ['M60-pages-wrangler-config', 'M61-pages-env-bridge'],
    goldenCoreReuse: 'M01–M16',
    em4Conflicts: ['CH-PAGES-001', 'CH-PAGES-002'],
    detectSignal: 'pages-worker-split',
    flows: ['auth-lifecycle', 'billing-subscription', 'password-reset', 'email-lifecycle'],
    extraProtocolIds: pagesProtocols.length ? pagesProtocols : ['owasp/csrf', 'cloudflare/worker-auth-routes'],
  },
};

for (const flow of matrix.flows ?? []) {
  if (!matrix.stackProfiles['SD-06'].flows.includes(flow.flowId)) continue;
  const cf = flow.scopeServices?.cloudflare;
  if (cf) {
    const ids = new Set(cf.protocolIds ?? []);
    for (const pid of matrix.stackProfiles['SD-06'].extraProtocolIds) ids.add(pid);
    cf.protocolIds = [...ids];
  }
}

matrix.rulesetVersion = '2026.06.07';
writeFileSync(path, JSON.stringify(matrix, null, 2) + '\n');
console.log(`✓ Per-flow scope — SD-06 stackProfile + ${matrix.flows.length} flows`);
