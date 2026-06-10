#!/usr/bin/env node
/** G-AZ readiness — required planning artifacts exist */
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const required = [
  'docs/engine/PLANNING_MASTER.md',
  'docs/engine/PLANNING_MCP_E2E_SUCCESS_CRITERIA.md',
  'docs/engine/PLANNING_MASTER_PLAN_TRACE.md',
  'docs/engine/PLANNING_AZ_SIGNOFF.md',
  'docs/engine/planning/e2e-golden-path.json',
  'docs/engine/planning/integration-matrix-registry.json',
  'docs/engine/planning/imagination-100-scenarios.json',
  'docs/engine/planning/em1-flow-steps.json',
  'docs/engine/planning/em3-legal-touchpoints.json',
  'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json',
  'docs/engine/PLANNING_PHASE1_CHUNK24_INTEGRATION_MATRIX.md',
  'docs/engine/PLANNING_PHASE1_CHUNK25_SCALE_B_PLAN.md',
  'docs/engine/PLANNING_GOLDEN_RUNTIME_SPEC.md',
  'docs/engine/PLANNING_PHASE1_CHUNK26_EM4_CROSS_HOST.md',
  'docs/engine/planning/em4-cross-host-matrix.json',
];

const failures = required.filter((p) => !existsSync(join(ROOT, p)));
if (failures.length) {
  console.error('G-AZ readiness missing:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ G-AZ readiness — ${required.length} artifacts present`);
process.exit(0);
