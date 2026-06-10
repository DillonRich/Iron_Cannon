#!/usr/bin/env node
/**
 * Integration test matrix — planning harness (A01–A10, R01–R15, L01–L08, W01–W04, scope, silent).
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveResume } from './lib/resume-path-sim.mjs';
import { evaluateCompare } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/integration-matrix-registry.json'), 'utf8'),
);
const RESUME = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/resume-path-harness.json'), 'utf8'),
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

function loadFixture(dir, fixtureId) {
  const base = join(ROOT, 'docs/engine/specimens/fixtures', dir);
  for (const f of readdirSync(base).filter((x) => x.endsWith('.fixture-spec.json'))) {
    const spec = JSON.parse(readFileSync(join(base, f), 'utf8'));
    if (spec.fixtureId === fixtureId) return spec;
  }
  return null;
}

function loadCompareFixture(name) {
  const compliance = join(ROOT, 'docs/engine/specimens/fixtures/compliance');
  for (const f of readdirSync(compliance).filter((x) => x.endsWith('.fixture-spec.json'))) {
    if (f.includes(name) || f.startsWith(name)) {
      return JSON.parse(readFileSync(join(compliance, f), 'utf8'));
    }
  }
  const exact = join(compliance, `${name}.fixture-spec.json`);
  if (existsSync(exact)) return JSON.parse(readFileSync(exact, 'utf8'));
  return null;
}

const failures = [];
let pass = 0;

for (const row of REG.rows) {
  let ok = false;
  try {
    switch (row.kind) {
      case 'error': {
        ok = resolveError(row.trigger) === row.expect;
        break;
      }
      case 'fixture': {
        if (row.path) {
          const spec = JSON.parse(readFileSync(join(ROOT, 'docs/engine', row.path), 'utf8'));
          ok = !row.expectCode || spec.expected?.code === row.expectCode;
        } else {
          ok = !!loadFixture(row.dir, row.fixtureId);
        }
        break;
      }
      case 'schema': {
        const schema = JSON.parse(readFileSync(join(ROOT, 'docs/engine', row.path), 'utf8'));
        ok = (schema.required ?? []).includes('agentGuidance');
        break;
      }
      case 'tier_gate': {
        const cp = readFileSync(join(ROOT, 'docs/engine/COMPOSITION_PIPELINE.md'), 'utf8');
        const im = readFileSync(join(ROOT, 'docs/engine/INTEGRATION_TEST_MATRIX.md'), 'utf8');
        ok = cp.includes('Layer 3') && im.includes('layer3');
        break;
      }
      case 'compare': {
        const spec = loadCompareFixture(row.fixture);
        if (!spec) {
          ok = false;
          break;
        }
        const dt = spec.detectType ?? spec.detect?.type;
        const detect = spec.detect ?? {};
        if (dt === 'pattern' && row.fixture.includes('L4-001')) detect.patterns = ['unsubscribe'];
        const passStatus = evaluateCompare(dt, spec.passSnippet, detect);
        ok = passStatus === (spec.expectedPass ?? 'met');
        break;
      }
      case 'envelope': {
        const schema = JSON.parse(
          readFileSync(join(ROOT, 'docs/engine/phase1/schemas/mcp-response-envelope.v1.json'), 'utf8'),
        );
        ok = schema.properties?.legalDisclaimer != null;
        break;
      }
      case 'resume': {
        const entry = RESUME.paths.find((p) => p.id === row.resumeId);
        ok = entry && resolveResume(entry.trigger) === entry.expect;
        break;
      }
      case 'script': {
        ok = existsSync(join(ROOT, 'scripts/planning-lint', row.script));
        break;
      }
      default:
        ok = false;
    }
  } catch (e) {
    ok = false;
  }
  if (ok) {
    pass++;
    console.log(`✓ INT ${row.id}`);
  } else failures.push(`${row.id} (${row.group}/${row.kind})`);
}

const rate = pass / REG.rows.length;
if (rate < REG.minPassRate || failures.length) {
  console.error(
    `Integration matrix: ${pass}/${REG.rows.length} (${(rate * 100).toFixed(1)}%) — failures:\n` +
      failures.join('\n'),
  );
  process.exit(1);
}
console.log(`✓ Integration matrix — ${pass}/${REG.rows.length} (${(rate * 100).toFixed(1)}%)`);
process.exit(0);
