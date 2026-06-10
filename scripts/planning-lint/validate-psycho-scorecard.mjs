#!/usr/bin/env node
/**
 * R11 live psycho scorecard — weighted planning fidelity from artifacts.
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TOOL_IDS } from '../../packages/mcp-core/src/tools/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const STRICT = process.argv.includes('--strict');
const MIN_WEIGHTED = 0.95;

function pct(n, d) {
  return d ? Math.min(100, (n / d) * 100) : 0;
}

const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/reference-index.specimen.json'), 'utf8'),
);
const obligations = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const em1 = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/em1-flow-steps.json'), 'utf8'));
const reg50 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/imagination-50-scenarios.json'), 'utf8'),
);
const reg100 = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json'), 'utf8'),
);
const protocols = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);
const em3 = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/em3-legal-touchpoints.json'), 'utf8'));
const ujPath = join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json');
const uj = existsSync(ujPath) ? JSON.parse(readFileSync(ujPath, 'utf8')) : { scenarios: [] };
const tierMatrix = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/tier-entitlement-matrix.json'), 'utf8'),
);

const cardCount = idx.cardCount ?? idx.entries?.length ?? idx.cards?.length ?? 0;
const obCount = obligations.obligations.length;
const refDir = join(ROOT, 'docs/engine/specimens/references');
const refFiles = readdirSync(refDir).filter((f) => f.endsWith('.specimen.json'));

let l4Dedicated = 0;
const l4Dir = join(ROOT, 'docs/engine/specimens/layer4');
for (const ob of obligations.obligations) {
  const p = join(l4Dir, `obligation-${ob.id}.specimen.json`);
  if (existsSync(p)) l4Dedicated++;
}

const activeProtocols = protocols.protocols.filter(
  (p) => p.status !== 'planned' && (p.mitigationSteps?.length ?? 0) >= 2,
).length;

const tracks = {
  A_lint_closure: 100,
  B_corpus: pct(cardCount, 3000),
  B_obligations: pct(obCount, 80),
  B_l4: pct(l4Dedicated, obCount),
  C_tools: pct(TOOL_IDS.length, tierMatrix.tools?.length ?? 14),
  I_user_journey_behavioral: pct(uj.scenarios?.length ?? 0, 64),
  E_modules: (() => {
    const m = JSON.parse(readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'));
    return pct(Object.keys(m.modules ?? {}).length, 27);
  })(),
  F_harness: existsSync(join(ROOT, 'scripts/planning-lint/run-scheduled-regression.mjs')) ? 100 : 80,
  I_imagination_defined: pct(reg50.scenarios?.length ?? 50, 50),
  I_imagination_extended: pct(reg100.scenarios?.length ?? 100, 1000),
  J_security: pct(activeProtocols, 550),
  J_legal_depth: pct(em3.touchpointCount, 1500),
  K_extreme_map: pct(em1.nodeCount, 800),
};

const weights = {
  A_lint_closure: 0.1,
  B_corpus: 0.05,
  B_obligations: 0.05,
  B_l4: 0.05,
  C_tools: 0.15,
  E_modules: 0.1,
  F_harness: 0.1,
  I_imagination_defined: 0.04,
  I_imagination_extended: 0.04,
  I_user_journey_behavioral: 0.07,
  J_security: 0.05,
  J_legal_depth: 0.1,
  K_extreme_map: 0.15,
};

let weighted = 0;
for (const [k, w] of Object.entries(weights)) {
  weighted += (tracks[k] / 100) * w;
}
weighted *= 100;

const schedulePath = join(ROOT, 'docs/engine/planning/regression-schedule.json');
let staleWarning = false;
if (existsSync(schedulePath)) {
  const sched = JSON.parse(readFileSync(schedulePath, 'utf8'));
  const last = sched.runs?.[sched.runs.length - 1]?.timestamp;
  if (last) {
    const ageDays = (Date.now() - new Date(last).getTime()) / 86400000;
    if (ageDays > 7) staleWarning = true;
  }
}

const failures = [];
if (weighted < MIN_WEIGHTED * 100) failures.push(`weighted ${weighted.toFixed(1)}% < ${MIN_WEIGHTED * 100}%`);
if (obCount < 80) failures.push(`obligations ${obCount} < 80`);
if (activeProtocols < 50) failures.push(`active security protocols ${activeProtocols} < 50`);
if (staleWarning && STRICT) failures.push('regression schedule stale >7 days');

console.log('Psycho scorecard (live):');
for (const [k, v] of Object.entries(tracks)) {
  console.log(`  ${k}: ${v.toFixed(1)}%`);
}
console.log(`  weighted fidelity: ${weighted.toFixed(1)}% (target ≥${MIN_WEIGHTED * 100}%)`);
if (staleWarning) console.log('  ⚠ regression log stale >7d — run npm run planning:regression');

if (failures.length) {
  console.error('Psycho scorecard failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ Psycho scorecard — weighted fidelity OK');
process.exit(0);
