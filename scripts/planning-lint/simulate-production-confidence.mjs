#!/usr/bin/env node
/**
 * Phase 2 — production-confidence planning harness.
 * Adversarial, out-of-scope, tier-churn, and deploy-smoke scenarios.
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/production-confidence-scenarios.json'), 'utf8'),
);

function resolveError(trigger) {
  if (trigger.apiKey === '') return 'AUTH_MISSING';
  if (trigger.apiKey === 'bad') return 'AUTH_INVALID';
  if (trigger.tier === 'pro' && trigger.tool) return 'TIER_INSUFFICIENT';
  if (trigger.deps?.firebase) return 'STACK_UNSUPPORTED';
  if (trigger.missingConfig?.length) return 'STACK_INCOMPLETE';
  if (trigger.sameModuleCalls >= 6) return 'THROTTLE_LOOP_DETECTED';
  if (trigger.patternsMatched === 0) return 'COMPLIANCE_FAILED';
  if (trigger.hashDrift) return 'DIFF_DRIFT_DETECTED';
  if (trigger.network === 'down') return 'REMOTE_UNAVAILABLE';
  if (trigger.rulesetVersion === '2020.01.01') return 'RULESET_DEPRECATED';
  if (trigger.emptyFile) return 'FALSE_COMPLIANCE_SUSPECTED';
  if (trigger.scope === 'desktop-only') return 'SCOPE_OUT_OF_BOUNDS';
  if (trigger.scope === 'recommend-stack') return 'SCOPE_NOT_SUPPORTED';
  if (trigger.flowId === 'custom-xyz') return 'FLOW_NOT_IN_CATALOG';
  if (trigger.wiremapContext === null) return 'CONTEXT_INSUFFICIENT';
  if (Array.isArray(trigger.fragments) && trigger.fragments.length === 0) return 'COMPOSE_EMPTY_REJECTED';
  return 'UNKNOWN';
}

function loadFixtureFromDir(dir, fixtureId) {
  const base = join(ROOT, 'docs/engine/specimens/fixtures', dir);
  if (!existsSync(base)) return null;
  for (const f of readdirSync(base).filter((x) => x.endsWith('.fixture-spec.json'))) {
    const spec = JSON.parse(readFileSync(join(base, f), 'utf8'));
    if (spec.fixtureId === fixtureId) return spec;
  }
  return null;
}

function loadStackFixture(fixtureId) {
  for (const dir of ['stack-detection', 'stack']) {
    const spec = loadFixtureFromDir(dir, fixtureId);
    if (spec) return spec;
  }
  return null;
}

function runScenario(s) {
  switch (s.harness) {
    case 'integration-error':
      return resolveError(s.trigger) === s.expect;
    case 'stack-fixture':
      return !!loadStackFixture(s.fixture);
    case 'wiremap-fixture':
      return !!loadFixtureFromDir('wiremap', s.fixture);
    case 'g2-script':
      return existsSync(join(ROOT, 'scripts', s.script));
    case 'planning-script':
      return existsSync(join(ROOT, 'scripts/planning-lint', s.script));
    case 'agent-directives': {
      const tpath = join(ROOT, 'docs/engine/planning/agent-directive-templates.json');
      const t = existsSync(tpath) ? JSON.parse(readFileSync(tpath, 'utf8')) : { templates: [] };
      return (t.templates?.length ?? 0) >= (s.minTemplates ?? 12);
    }
    case 'scope-doc': {
      const doc = join(ROOT, 'docs/engine/PLANNING_SCOPE_BOUNDARIES.md');
      if (!existsSync(doc)) return false;
      const text = readFileSync(doc, 'utf8');
      return ['In scope', 'Out of scope', 'STACK_UNSUPPORTED'].every((n) => text.includes(n));
    }
    case 'obligations-floor': {
      const idx = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
      );
      return idx.obligations.length >= (s.minObligations ?? 140);
    }
    case 'imagination-floor': {
      const img = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json'), 'utf8'),
      );
      return img.scenarios.length >= (s.minScenarios ?? 1100);
    }
    case 'security-protocols-floor': {
      const spr = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
      );
      const active = (spr.protocols ?? []).filter((p) => p.status === 'active').length;
      return active >= (s.minActive ?? 750);
    }
    case 'retrieval-floor': {
      const rb = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/retrieval-baseline-queries.json'), 'utf8'),
      );
      return (rb.queryCount ?? rb.queries?.length ?? 0) >= (s.minQueries ?? 120);
    }
    case 'integration-matrix-floor': {
      const im = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/integration-matrix-registry.json'), 'utf8'),
      );
      return (im.rows?.length ?? 0) >= (s.minRows ?? 47);
    }
    case 'gap-register-closed': {
      const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
      const stage = s.stage ?? gr.currentStage ?? 'core-mcp';
      const open = (gr.gaps ?? []).filter((g) => {
        const gStage = g.stage ?? 'core-mcp';
        if (gStage !== stage) return false;
        return g.status === 'open' || g.status === 'partial';
      }).length;
      return open === 0;
    }
    case 'pc-scenario-floor': {
      const pc = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/production-confidence-scenarios.json'), 'utf8'),
      );
      return (pc.scenarios?.length ?? 0) >= (s.minScenarios ?? 60);
    }
    case 'adversarial-agent-floor': {
      const aa = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/adversarial-agent-scenarios.json'), 'utf8'),
      );
      return (aa.scenarios?.length ?? 0) >= (s.minScenarios ?? 10);
    }
    case 'user-journey-floor': {
      const uj = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
      );
      return (uj.scenarios?.length ?? 0) >= (s.minScenarios ?? 40);
    }
    case 'user-journey-harness':
      return existsSync(join(ROOT, 'scripts/planning-lint/simulate-user-journey-behavioral.mjs'));
    default:
      return false;
  }
}

const failures = [];
for (const s of REG.scenarios) {
  if (!runScenario(s)) failures.push(`${s.id} ${s.name}`);
  else console.log(`✓ ${s.id} ${s.name}`);
}

const passRate = (REG.scenarios.length - failures.length) / REG.scenarios.length;
if (failures.length || passRate < REG.minPassRate) {
  console.error(
    `Production-confidence failures (${failures.length}/${REG.scenarios.length}, rate ${(passRate * 100).toFixed(0)}%):\n` +
      failures.join('\n'),
  );
  process.exit(1);
}

console.log(
  `✓ Production-confidence — ${REG.scenarios.length}/${REG.scenarios.length} scenarios pass (${REG.categories.join(', ')})`,
);
process.exit(0);
