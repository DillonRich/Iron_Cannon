#!/usr/bin/env node
/** SVC-002 wave 81 — SD-07 stack profile in per-flow-scope matrix. */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/per-flow-scope-matrix.json');
const matrix = JSON.parse(readFileSync(path, 'utf8'));

const registry = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);
const supaProtocols = registry.protocols
  .filter((p) => p.protocolId.includes('w80-') || p.protocolId.includes('w81-'))
  .slice(0, 4)
  .map((p) => p.protocolId);

matrix.stackProfiles = {
  ...(matrix.stackProfiles ?? {}),
  'SD-07': {
    label: 'Supabase-primary (SVC-002)',
    prependedModules: ['M70-supabase-auth-config', 'M71-supabase-middleware-ssr'],
    goldenCoreReuse: 'M11–M16 billing only (no D1 auth)',
    em4Conflicts: ['CH-SUPA-001', 'CH-SUPA-002', 'CH-005'],
    detectSignal: 'SUPABASE_PRIMARY',
    flows: ['auth-lifecycle', 'billing-subscription', 'password-reset', 'email-lifecycle'],
    extraProtocolIds: supaProtocols.length ? supaProtocols : ['owasp/csrf', 'supabase/auth-helpers-nextjs'],
  },
};

for (const flow of matrix.flows ?? []) {
  if (!matrix.stackProfiles['SD-07'].flows.includes(flow.flowId)) continue;
  const cf = flow.scopeServices?.cloudflare;
  if (cf) {
    const ids = new Set(cf.protocolIds ?? []);
    for (const pid of matrix.stackProfiles['SD-07'].extraProtocolIds) ids.add(pid);
    cf.protocolIds = [...ids];
  }
}

matrix.rulesetVersion = '2026.06.08';
writeFileSync(path, JSON.stringify(matrix, null, 2) + '\n');
console.log(`✓ Per-flow scope — SD-07 stackProfile + ${matrix.flows.length} flows`);
