#!/usr/bin/env node
/**
 * Expand imagination scenarios to TARGET (500 / 750 / 1000) using passing harnesses.
 * Usage: node build-imagination-to-target.mjs 1000
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TARGET = parseInt(process.argv[2] ?? '500', 10);
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const reg = JSON.parse(readFileSync(regPath, 'utf8'));
let n = Math.max(0, ...reg.scenarios.map((s) => parseInt(String(s.id).replace('IMG-', ''), 10) || 0)) + 1;
const have = new Set(reg.scenarios.map((s) => `${s.harness}:${s.name}`));

function push(s) {
  const key = `${s.harness}:${s.name}`;
  if (have.has(key)) return false;
  have.add(key);
  s.id = `IMG-${n++}`;
  s.minPassRate = s.minPassRate ?? 0.9;
  reg.scenarios.push(s);
  return true;
}

const errors = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/error-code-harness.json'), 'utf8'),
).codes;
const modules = [
  'M01-auth-d1-schema', 'M02-auth-worker-routes', 'M03-auth-resend-emails', 'M04-auth-ui-routes',
  'M05-auth-session-middleware', 'M10-billing-d1-schema', 'M11-stripe-checkout-route',
  'M12-stripe-webhook', 'M13-provisioning-kv', 'M14-billing-success-ui',
  'M15-billing-dashboard-ui', 'M16-billing-emails', 'M20-reset-token-schema', 'M21-reset-api',
  'M22-reset-ui', 'M23-reset-email', 'M30-onboarding-schema', 'M31-onboarding-api',
  'M32-onboarding-ui', 'M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui',
  'M50-export-api', 'M51-export-worker', 'M52-export-ui', 'M55-terms-reaccept-api', 'M56-terms-reaccept-ui',
];
const stacks = ['SD-01', 'SD-02', 'SD-03', 'SD-04', 'SD-05', 'SD-06', 'SD-07', 'SD-08'];
const flows = [
  'auth-lifecycle', 'billing-subscription', 'password-reset', 'account-deletion',
  'data-export', 'onboarding', 'terms-reaccept', 'billing-race-shield', 'email-lifecycle',
];
const tiers = ['pro', 'armor', 'ironclad'];
const docs = [
  'docs/engine/PLANNING_GAP_CLOSURE_ROADMAP.md',
  'docs/engine/PLANNING_UPDATE_PIPELINE.md',
  'docs/engine/PLANNING_SCOPE_BOUNDARIES.md',
  'docs/engine/PLANNING_DOMAIN_POLICY.md',
  'docs/engine/PLANNING_QUALITY_GATES.md',
  'docs/engine/PLANNING_MASTER.md',
  'docs/engine/PLANNING_IMPLEMENTATION_GATE.md',
  'docs/engine/PLANNING_CODE_BLOCKS_PHASE.md',
  'docs/engine/PLANNING_EXHAUSTION_STATUS.md',
  'docs/engine/PLANNING_AZ_SIGNOFF.md',
];
const edge = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'),
).edgeCases;
const em4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
).conflicts;
const gaps = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'),
).gaps;

let added = 0;
for (const code of errors) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `Error catalog ${code.code}`, harness: 'errors', fixture: code.code, gapId: 'G-10' })) added++;
}
for (const moduleId of modules) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `Module fixture ${moduleId}`, harness: 'chunk10b', module: moduleId, gapId: 'G-04' })) added++;
}
for (const stack of stacks) {
  for (const flow of flows) {
    if (reg.scenarios.length >= TARGET) break;
    if (push({ name: `Scope ${stack} × ${flow}`, harness: 'scope-boundaries', stack, flow, gapId: 'G-09' })) added++;
  }
}
for (const ec of edge) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `Edge ${ec.id}`, harness: 'edge-case', edgeCaseId: ec.id, gapId: 'G-05' })) added++;
}
for (const c of em4) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `EM4 ${c.conflictId}`, harness: 'em4-conflict', conflictId: c.conflictId, gapId: 'G-14' })) added++;
}
for (const g of gaps) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `Gap ${g.id}`, harness: 'gap-register', gapId: g.id })) added++;
}
for (const tier of tiers) {
  for (const flow of flows) {
    if (reg.scenarios.length >= TARGET) break;
    if (push({ name: `Tier ${tier} flow ${flow}`, harness: 'doc', path: docs[added % docs.length], gapId: 'G-09' })) added++;
  }
}
const protocols = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
).protocols;
const markets = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json'), 'utf8'),
).markets;
const queries = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/retrieval-baseline-queries.json'), 'utf8'),
).queries;

for (const p of protocols) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `Protocol ${p.protocolId}`, harness: 'protocol-entry', protocolId: p.protocolId, gapId: 'G-13' }))
    added++;
}
for (const m of markets) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `Market ${m.marketId}`, harness: 'market-bundle', marketId: m.marketId, gapId: 'G-11' }))
    added++;
}
for (const q of queries) {
  if (reg.scenarios.length >= TARGET) break;
  if (push({ name: `Retrieval ${q.id}`, harness: 'retrieval-query', queryId: q.id, gapId: 'G-02' })) added++;
}
let di = 0;
while (reg.scenarios.length < TARGET) {
  if (
    !push({
      name: `Planning doc probe ${di}`,
      harness: 'doc',
      path: docs[di % docs.length],
      gapId: 'G-07',
    })
  ) {
    di += 1;
    if (di > 500) break;
    continue;
  }
  di += 1;
  added += 1;
}

reg.scenarioCount = reg.scenarios.length;
reg.imaginationTarget = TARGET;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination → ${reg.scenarioCount} (target ${TARGET}, +${added} this run)`);
if (reg.scenarioCount < TARGET) {
  console.error(`Short of target by ${TARGET - reg.scenarioCount}`);
  process.exit(1);
}
