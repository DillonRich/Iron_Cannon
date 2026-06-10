#!/usr/bin/env node
/**
 * Extensive planning validation — regression + stretch metrics + golden path probes.
 * Usage: npm run planning:stretch-test
 */
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const LINT = join(ROOT, 'scripts/planning-lint');

function run(script, args = []) {
  const r = spawnSync(process.execPath, [join(LINT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { ok: r.status === 0, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

const suites = [
  { name: 'regression', cmd: () => spawnSync('npm', ['run', 'planning:regression'], { cwd: ROOT, shell: true, encoding: 'utf8' }) },
  { name: 'retrieval', script: 'simulate-retrieval-baseline.mjs' },
  { name: 'obligations', script: 'simulate-obligation-fixtures.mjs' },
  { name: 'obligationsMin', script: 'validate-obligations-min.mjs' },
  { name: 'mcpE2e', script: 'simulate-mcp-e2e-golden.mjs' },
  { name: 'userJourney', script: 'simulate-user-journey-behavioral.mjs' },
  { name: 'integration', script: 'simulate-integration-matrix.mjs' },
  { name: 'composeTier', script: 'simulate-compose-tier-ec013.mjs' },
  { name: 'extremeMap', script: 'validate-extreme-map-coverage.mjs' },
  { name: 'em2', script: 'validate-em2-security-controls.mjs' },
  { name: 'em3', script: 'validate-em3-legal-touchpoints.mjs' },
  { name: 'em4', script: 'validate-em4-cross-host.mjs' },
  { name: 'psycho', script: 'validate-psycho-scorecard.mjs' },
  { name: 'gapRegister', script: 'validate-gap-register.mjs' },
  { name: 'vendorFreshness', script: 'validate-vendor-freshness.mjs' },
  { name: 'vendorChangelogWatch', script: 'validate-vendor-changelog-watch.mjs' },
  { name: 'corpusDepth', script: 'validate-corpus-depth.mjs' },
  { name: 'corpusHarvestQuality', script: 'validate-corpus-harvest-quality.mjs' },
  { name: 'codeBlocks', script: 'validate-planning-code-blocks.mjs' },
  { name: 'scopeBoundaries', script: 'validate-scope-boundaries.mjs' },
  { name: 'postCoreRoadmap', script: 'validate-post-core-roadmap.mjs' },
  { name: 'goldenReferenceApp', script: 'simulate-golden-reference-app.mjs' },
  { name: 'referenceAppGoldenPath', script: 'simulate-reference-app-golden-path.mjs' },
  { name: 'svc001Spike', script: 'validate-svc001-spike.mjs' },
  { name: 'svc001Wave78', script: 'validate-svc001-wave78.mjs' },
  { name: 'svc001Signoff', script: 'validate-svc001-signoff.mjs' },
  { name: 'svc002Spike', script: 'validate-svc002-spike.mjs' },
  { name: 'svc002Wave80', script: 'validate-svc002-wave80.mjs' },
  { name: 'svc002Signoff', script: 'validate-svc002-signoff.mjs' },
  { name: 'serviceExpansionCycle', script: 'validate-service-expansion-cycle.mjs' },
  { name: 'g34SessionHarvest', script: 'validate-g34-session-harvest.mjs' },
  { name: 'operatorDeployReadiness', script: 'validate-operator-deploy-readiness.mjs' },
  { name: 'g37Wave85Harvest', script: 'validate-g37-wave85-harvest.mjs' },
  { name: 'businessInfraPlan', script: 'validate-business-infra-plan.mjs' },
  { name: 'g42Wave87Harvest', script: 'validate-g42-wave87-harvest.mjs' },
  { name: 'g43Wave88DogfoodPrep', script: 'validate-g43-wave88-dogfood-prep.mjs' },
  { name: 'g39DogfoodLive', script: 'validate-g39-dogfood-live.mjs' },
  { name: 'g44Wave89StripePrep', script: 'validate-g44-wave89-stripe-prep.mjs' },
  { name: 'g45Wave90AffiliatesPrep', script: 'validate-g45-wave90-affiliates-prep.mjs' },
  { name: 'operatorPreflightBundle', script: 'validate-operator-preflight-bundle.mjs' },
  { name: 'g46Wave91PolishArc', script: 'validate-g46-wave91-polish-arc.mjs' },
  { name: 'g47Wave92DogfoodHarvest', script: 'validate-g47-wave92-dogfood-harvest.mjs' },
  { name: 'g48Wave93GuardianTrust', script: 'validate-g48-wave93-guardian-trust.mjs' },
  { name: 'g49Wave94PatternEquivalence', script: 'validate-g49-wave94.mjs' },
  { name: 'g55g57Wave100_102', script: 'validate-g55-g57-wave100-102.mjs' },
];

const failures = [];
for (const s of suites) {
  let ok = false;
  let out = '';
  if (s.cmd) {
    const r = s.cmd();
    ok = r.status === 0;
    out = (r.stdout ?? '') + (r.stderr ?? '');
  } else {
    const r = run(s.script);
    ok = r.ok;
    out = r.out;
  }
  if (!ok) {
    failures.push(s.name);
    console.error(`✗ ${s.name}\n${out.slice(-2000)}`);
  } else {
    console.log(`✓ ${s.name}`);
  }
}

const metrics = {};
if (existsSync(join(ROOT, 'docs/engine/planning/em1-flow-steps.json'))) {
  metrics.em1 = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/em1-flow-steps.json'), 'utf8')).nodeCount;
}
if (existsSync(join(ROOT, 'docs/engine/planning/em0-config-nodes.json'))) {
  metrics.em0Config = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/em0-config-nodes.json'), 'utf8')).nodeCount;
}
metrics.cards = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/reference-index.specimen.json'), 'utf8'),
).cardCount;
metrics.obligations = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
).obligations.length;

const logPath = join(ROOT, 'docs/engine/planning/stretch-test-log.json');
const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) : { runs: [] };
log.runs.push({ timestamp: new Date().toISOString(), pass: failures.length === 0, failures, metrics });
if (log.runs.length > 60) log.runs = log.runs.slice(-60);
writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');

if (failures.length) {
  console.error(`Stretch suite FAILED: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`✓ Planning stretch suite — ${suites.length} suites, metrics ${JSON.stringify(metrics)}`);
process.exit(0);
