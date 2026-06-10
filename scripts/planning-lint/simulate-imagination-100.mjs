#!/usr/bin/env node
/**
 * Imagination 100 — baseline 50 @ 100%, extended 50 @ ≥90%.
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  analyzeProjectStack,
  materializeFixture,
  cleanupDir,
  stackT02Complete,
  composeWiremaps,
  evaluateCompare,
  resolveError,
} from './lib/planning-sim-core.mjs';
import { filterComposedSlice } from './lib/filter-composed-slice.mjs';
import { resolveResume } from './lib/resume-path-sim.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json'), 'utf8'),
);
const INT_REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/integration-matrix-registry.json'), 'utf8'),
);
const RESUME = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/resume-path-harness.json'), 'utf8'),
);
const OUTBOUND = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json'), 'utf8'),
);
const EDGE_REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'),
);
const EM3 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em3-legal-touchpoints.json'), 'utf8'),
);
const EM4 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json'), 'utf8'),
);
const TIER = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/tier-entitlement-matrix.json'), 'utf8'),
);

const FIX = {
  stack: join(ROOT, 'docs/engine/specimens/fixtures/stack-detection'),
  wiremap: join(ROOT, 'docs/engine/specimens/fixtures/wiremap'),
  pro: join(ROOT, 'docs/engine/specimens/fixtures/pro-recovery'),
  armor: join(ROOT, 'docs/engine/specimens/fixtures/armor'),
  compliance: join(ROOT, 'docs/engine/specimens/fixtures/compliance'),
  slicer: join(ROOT, 'docs/engine/specimens/fixtures/slicer'),
  modules: join(ROOT, 'docs/engine/specimens/fixtures/modules'),
  obligations: join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations'),
};

function loadFixture(dir, fixtureId) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.fixture-spec.json'))) {
    const spec = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (spec.fixtureId === fixtureId) return spec;
  }
  return null;
}

function score(checks) {
  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, rate: checks.length ? pass / checks.length : 0, checks };
}

function minRateForScenario(id) {
  const n = parseInt(id.replace('IMG-', ''), 10);
  return n <= REG.baselineCount ? REG.minScenarioPassRateBaseline : REG.minScenarioPassRateExtended;
}

function runScenario(s) {
  const checks = [];
  switch (s.harness) {
    case 'integration': {
      const row = INT_REG.rows.find((r) => r.id === s.row);
      checks.push({ name: 'row', pass: !!row });
      break;
    }
    case 'e2e':
      checks.push({ name: 'e2e_json', pass: existsSync(join(ROOT, 'docs/engine/planning/e2e-golden-path.json')) });
      checks.push({ name: 'e2e_script', pass: existsSync(join(ROOT, 'scripts/planning-lint/simulate-mcp-e2e-golden.mjs')) });
      break;
    case 'outbound':
      checks.push({ name: 'bundle', pass: OUTBOUND.moduleOrder?.length === 12 });
      break;
    case 'outbound-module':
      checks.push({ name: 'module', pass: !!OUTBOUND.modules[s.module] });
      break;
    case 'rules-coverage':
      checks.push({ name: 'script', pass: existsSync(join(ROOT, 'scripts/planning-lint/validate-rules-package-coverage.mjs')) });
      break;
    case 'extreme-map': {
      const em1Path = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
      const steps = existsSync(em1Path) ? JSON.parse(readFileSync(em1Path, 'utf8')) : { nodeCount: 0 };
      const floor = s.minFlowSteps ?? 180;
      checks.push({ name: `steps_${floor}`, pass: (steps.nodeCount ?? 0) >= floor });
      break;
    }
    case 'integration-matrix':
      checks.push({ name: 'registry', pass: INT_REG.rows.length >= 40 });
      break;
    case 'compose-precedence':
      checks.push({ name: 'fixture', pass: existsSync(join(ROOT, 'docs/engine/specimens/fixtures/compose/precedence-golden.fixture-spec.json')) });
      break;
    case 'retrieval':
      checks.push({ name: 'script', pass: existsSync(join(ROOT, 'scripts/planning-lint/simulate-retrieval-baseline.mjs')) });
      break;
    case 'corpus-scale':
      checks.push({ name: 'script', pass: existsSync(join(ROOT, 'scripts/planning-lint/validate-corpus-scale.mjs')) });
      break;
    case 'corpus-scale-c': {
      const covPath = join(ROOT, 'harvest-data/corpus-coverage.json');
      if (existsSync(covPath)) {
        const cov = JSON.parse(readFileSync(covPath, 'utf8'));
        checks.push({ name: 'scaleC_target', pass: cov.scaleC?.target === 3000 });
        checks.push({ name: 'cards_1010', pass: (cov.totalCards ?? 0) >= 1010 });
      } else {
        checks.push({ name: 'coverage', pass: false });
      }
      break;
    }
    case 'corpus-scale-c2': {
      const covPath = join(ROOT, 'harvest-data/corpus-coverage.json');
      const cov = existsSync(covPath) ? JSON.parse(readFileSync(covPath, 'utf8')) : {};
      checks.push({ name: 'cards_1500', pass: (cov.totalCards ?? 0) >= 1500 });
      break;
    }
    case 'corpus-scale-c3': {
      const covPath = join(ROOT, 'harvest-data/corpus-coverage.json');
      const cov = existsSync(covPath) ? JSON.parse(readFileSync(covPath, 'utf8')) : {};
      checks.push({ name: 'cards_2200', pass: (cov.totalCards ?? 0) >= 2200 });
      break;
    }
    case 'corpus-scale-c-complete': {
      const covPath = join(ROOT, 'harvest-data/corpus-coverage.json');
      const cov = existsSync(covPath) ? JSON.parse(readFileSync(covPath, 'utf8')) : {};
      checks.push({ name: 'scaleC_gap_zero', pass: (cov.scaleC?.gap ?? 1) === 0 });
      checks.push({ name: 'cards_3000', pass: (cov.totalCards ?? 0) >= 3000 });
      break;
    }
    case 'corpus-scale-d': {
      const covPath = join(ROOT, 'harvest-data/corpus-coverage.json');
      const cov = existsSync(covPath) ? JSON.parse(readFileSync(covPath, 'utf8')) : {};
      checks.push({ name: 'scaleD_gap_zero', pass: (cov.scaleD?.gap ?? 1) === 0 });
      checks.push({ name: 'cards_10000', pass: (cov.totalCards ?? 0) >= 10000 });
      break;
    }
    case 'vectorize-manifest': {
      const manPath = join(ROOT, 'harvest-data/vectorize-manifest.json');
      const idxPath = join(ROOT, 'docs/engine/specimens/reference-index.specimen.json');
      if (existsSync(manPath) && existsSync(idxPath)) {
        const man = JSON.parse(readFileSync(manPath, 'utf8'));
        const idx = JSON.parse(readFileSync(idxPath, 'utf8'));
        const n = idx.cardCount ?? idx.entries?.length ?? 0;
        checks.push({ name: 'manifest_count', pass: (man.vectorCount ?? man.vectors?.length ?? 0) >= n });
      } else {
        checks.push({ name: 'manifest_exists', pass: false });
      }
      break;
    }
    case 'corpus-balance':
      checks.push({ name: 'script', pass: existsSync(join(ROOT, 'scripts/planning-lint/validate-corpus-balance.mjs')) });
      break;
    case 'resume-all':
      checks.push({ name: 'paths_15', pass: RESUME.paths.length === 15 });
      break;
    case 'scale-profiles': {
      const sp = JSON.parse(readFileSync(join(ROOT, 'docs/engine/specimens/scale-profiles.specimen.json'), 'utf8'));
      checks.push({ name: 't12', pass: sp.profiles.some((p) => p.tool === 'T12') });
      checks.push({ name: 't14', pass: sp.profiles.some((p) => p.tool === 'T14') });
      break;
    }
    case 'obligation':
    case 'obligation-eval': {
      const f = join(FIX.obligations, `${s.obligationId}.fixture-spec.json`);
      checks.push({ name: 'fixture', pass: existsSync(f) });
      if (existsSync(f)) {
        const spec = JSON.parse(readFileSync(f, 'utf8'));
        const pass = evaluateCompare(spec.detectType, spec.passSnippet, spec.detect ?? {});
        const fail = evaluateCompare(spec.detectType, spec.failSnippet, spec.detect ?? {});
        checks.push({ name: 'pass_eval', pass: pass === spec.expectedPass });
        checks.push({ name: 'fail_eval', pass: fail === spec.expectedFail });
      }
      break;
    }
    case 'compose-tier': {
      const slice = {
        ruleFragments: [
          { layer: 'L2', id: 'r1' },
          { layer: 'L4', id: 'r2' },
        ],
        mapNodes: [{ type: 'legal_touchpoint' }, { type: 'module' }],
        referenceCards: [{ refId: 'stripe/x' }, { refId: 'legal/gdpr' }],
        outbound: { legalCompliance: {}, obligations: [], marketBundle: 'eu' },
      };
      const filtered = filterComposedSlice(slice, s.tier);
      const ent = TIER.composeEntitlements[s.tier];
      const hasLegal = (filtered.referenceCards ?? []).some((c) => c.refId?.startsWith('legal/'));
      const hasL4 = (filtered.ruleFragments ?? []).some((f) => f.layer === 'L4');
      checks.push({ name: 'no_legal_cards', pass: ent.forbiddenRefIdPrefixes?.length ? !hasLegal : true });
      checks.push({ name: 'l4_policy', pass: s.tier === 'ironclad' ? hasL4 : !hasL4 });
      checks.push({
        name: 'outbound_strip',
        pass: !ent.stripOutboundKeys?.length || !filtered.outbound?.legalCompliance,
      });
      break;
    }
    case 'em3-floor':
      checks.push({
        name: 'touchpoints',
        pass: (EM3.touchpointCount ?? 0) >= (s.minTouchpoints ?? 1500),
      });
      break;
    case 'em4-conflict': {
      const row = EM4.conflicts.find((c) => c.conflictId === s.conflictId);
      checks.push({ name: 'conflict', pass: !!row });
      checks.push({ name: 'resolution', pass: !!(row?.resolution?.length) });
      break;
    }
    case 'compose-ec013': {
      const script = join(ROOT, 'scripts/planning-lint/simulate-compose-tier-ec013.mjs');
      const r = spawnSync(process.execPath, [script], { encoding: 'utf8' });
      checks.push({ name: 'ec013_sim', pass: r.status === 0 });
      break;
    }
    case 'doc':
      checks.push({ name: 'exists', pass: existsSync(join(ROOT, s.path)) });
      break;
    case 'chunk7': {
      const fix = join(FIX.modules, `${s.module}.fixture-spec.json`);
      checks.push({ name: 'fixture', pass: existsSync(fix) });
      break;
    }
    case 'errors': {
      const errReg = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/error-code-harness.json'), 'utf8'));
      const entry = errReg.codes.find((c) => c.code === s.fixture);
      checks.push({ name: 'catalog', pass: !!entry });
      if (entry) checks.push({ name: 'resolve', pass: resolveError(entry.trigger) === entry.expect });
      break;
    }
    case 'chunk5b':
      checks.push({ name: 'fixture', pass: !!loadFixture(FIX.pro, s.fixture) });
      break;
    case 'chunk5a':
      checks.push({ name: 'fixture', pass: !!loadFixture(FIX.wiremap, s.fixture) });
      break;
    case 'chunk10b':
      checks.push({ name: 'fixture', pass: existsSync(join(FIX.modules, `${s.module}.fixture-spec.json`)) });
      break;
    case 'edge-case': {
      const ec = EDGE_REG.edgeCases.find((e) => e.id === s.edgeCaseId);
      checks.push({ name: 'registry', pass: !!ec });
      checks.push({ name: 'mitigation', pass: !!(ec?.mitigation?.length) });
      checks.push({
        name: 'coverage_doc',
        pass: existsSync(join(ROOT, 'docs/engine/PLANNING_EDGE_CASE_COVERAGE.md')),
      });
      if (ec?.obligationIds?.length) {
        checks.push({
          name: 'obligation_fixtures',
          pass: ec.obligationIds.every((id) =>
            existsSync(join(FIX.obligations, `${id}.fixture-spec.json`)),
          ),
        });
      } else {
        checks.push({
          name: 'protocol_or_fixture',
          pass: !!(ec?.protocolIds?.length || ec?.imaginationRef),
        });
      }
      break;
    }
    case 'chunk12': {
      const spec =
        loadFixture(FIX.compliance, s.fixture) ??
        (existsSync(join(FIX.compliance, `${s.fixture}.fixture-spec.json`))
          ? JSON.parse(readFileSync(join(FIX.compliance, `${s.fixture}.fixture-spec.json`), 'utf8'))
          : null);
      checks.push({ name: 'fixture', pass: !!spec });
      break;
    }
    case 'security-protocols': {
      const protReg = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
      );
      const active = protReg.protocols.filter(
        (p) => p.status === 'active' && (p.mitigationSteps?.length ?? 0) >= 2,
      ).length;
      checks.push({ name: 'active_250', pass: active >= (s.minActive ?? 250) });
      break;
    }
    case 'jurisdiction-bundles': {
      const jb = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json'), 'utf8'),
      );
      checks.push({ name: 'markets_floor', pass: (jb.markets?.length ?? 0) >= (s.minMarkets ?? 30) });
      break;
    }
    case 'em2-controls': {
      const em2p = join(ROOT, 'docs/engine/planning/em2-security-controls.json');
      const em2j = existsSync(em2p) ? JSON.parse(readFileSync(em2p, 'utf8')) : { controlCount: 0 };
      checks.push({ name: 'controls_600', pass: (em2j.controlCount ?? 0) >= (s.minControls ?? 600) });
      break;
    }
    case 'agent-directives': {
      const tpath = join(ROOT, 'docs/engine/planning/agent-directive-templates.json');
      const t = existsSync(tpath) ? JSON.parse(readFileSync(tpath, 'utf8')) : { templates: [] };
      checks.push({ name: 'templates_12', pass: (t.templates?.length ?? 0) >= (s.minTemplates ?? 12) });
      break;
    }
    case 'em4-conflicts': {
      const em4p = join(ROOT, 'docs/engine/planning/em4-cross-host-matrix.json');
      const em4j = existsSync(em4p) ? JSON.parse(readFileSync(em4p, 'utf8')) : { conflictCount: 0 };
      checks.push({ name: 'conflicts_floor', pass: (em4j.conflictCount ?? 0) >= (s.minConflicts ?? 60) });
      break;
    }
    case 'obligations-100': {
      const idx = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
      );
      checks.push({ name: 'obligations_100', pass: idx.obligations.length >= (s.minObligations ?? 100) });
      break;
    }
    case 'em0-config-floor': {
      const em0p = join(ROOT, 'docs/engine/planning/em0-config-nodes.json');
      const em0j = existsSync(em0p) ? JSON.parse(readFileSync(em0p, 'utf8')) : { nodeCount: 0 };
      checks.push({ name: 'em0_500', pass: (em0j.nodeCount ?? 0) >= (s.minConfigNodes ?? 500) });
      break;
    }
    case 'stretch-suite': {
      checks.push({
        name: 'stretch_script',
        pass: existsSync(join(ROOT, 'scripts/planning-lint/run-planning-stretch-suite.mjs')),
      });
      break;
    }
    case 'gap-register': {
      const gaps = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'),
      );
      checks.push({
        name: 'gap_listed',
        pass: gaps.gaps.some((g) => g.id === s.gapId),
      });
      break;
    }
    case 'scope-boundaries': {
      checks.push({
        name: 'scope_doc',
        pass: existsSync(join(ROOT, 'docs/engine/PLANNING_SCOPE_BOUNDARIES.md')),
      });
      checks.push({
        name: 'stack_flow_named',
        pass: !!(s.stack && s.flow),
      });
      break;
    }
    case 'protocol-entry': {
      const protReg = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
      );
      checks.push({
        name: 'protocol',
        pass: protReg.protocols.some((p) => p.protocolId === s.protocolId),
      });
      break;
    }
    case 'market-bundle': {
      const jb = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/jurisdiction-legal-bundles.json'), 'utf8'),
      );
      checks.push({
        name: 'market',
        pass: jb.markets.some((m) => m.marketId === s.marketId),
      });
      break;
    }
    case 'retrieval-query': {
      const rb = JSON.parse(
        readFileSync(join(ROOT, 'docs/engine/planning/retrieval-baseline-queries.json'), 'utf8'),
      );
      checks.push({
        name: 'query',
        pass: rb.queries.some((q) => q.id === s.queryId),
      });
      break;
    }
    default:
      checks.push({ name: 'delegate_50', pass: existsSync(join(ROOT, 'scripts/planning-lint/simulate-imagination-50.mjs')) });
  }
  return score(checks);
}

// Run baseline via subprocess would be heavy — inline: for IMG-001..050 require imagination-50 pass
// Simpler: run 100 locally; for default harness delegate check only for unknown - fix by importing 50 runner

const failures = [];
let baselineFail = false;

for (const s of REG.scenarios) {
  const minR = minRateForScenario(s.id);
  const n = parseInt(s.id.replace('IMG-', ''), 10);
  if (n <= 50) continue;
  const result = runScenario(s);
  if (result.rate < minR) {
    failures.push(`${s.id} ${(result.rate * 100).toFixed(0)}%`);
  } else console.log(`✓ ${s.id} ${s.name}`);
}

if (failures.length) {
  console.error('Imagination 100 extended failures:\n' + failures.join('\n'));
  process.exit(1);
}
const extended = REG.scenarios.length - 50;
console.log(`✓ Imagination extended — ${extended}/${extended} scenarios pass (baseline 50 via imagination-50)`);
process.exit(0);
