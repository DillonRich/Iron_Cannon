#!/usr/bin/env node
/** G-∞ Phase A — required planning docs + artifacts exist */
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const requiredDocs = [
  'docs/engine/PLANNING_INFINITE_DEPTH_ROADMAP.md',
  'docs/engine/PLANNING_TIER_CAPABILITY_MATRIX.md',
  'docs/engine/PLANNING_COMPOSE_TIER_REDACTION.md',
  'docs/engine/PLANNING_SECURITY_KNOWLEDGE_SCALE.md',
  'docs/engine/PLANNING_LEGAL_KNOWLEDGE_SCALE.md',
  'docs/engine/PLANNING_PER_SCOPE_SERVICE_DEEP_DIVE.md',
  'docs/engine/PLANNING_AGENT_MITIGATION_GUIDANCE.md',
  'docs/engine/PLANNING_EDGE_CASE_COVERAGE.md',
  'docs/engine/planning/edge-case-registry.json',
  'docs/engine/PLANNING_SCHEDULED_REGRESSION.md',
  'docs/engine/PLANNING_QUALITY_GATES.md',
  'docs/engine/planning/regression-schedule.json',
];

const requiredJson = [
  'docs/engine/planning/tier-entitlement-matrix.json',
  'docs/engine/planning/security-protocol-registry.json',
  'docs/engine/planning/jurisdiction-legal-bundles.json',
  'docs/engine/planning/per-flow-scope-matrix.json',
  'docs/engine/planning/scale-b-harvest-queue.json',
  'docs/engine/planning/scale-b-seed-urls.json',
  'docs/engine/planning/scale-c-harvest-queue.json',
  'docs/engine/planning/agent-directive-templates.json',
];

const failures = [];
for (const p of [...requiredDocs, ...requiredJson]) {
  if (!existsSync(join(ROOT, p))) failures.push(`missing ${p}`);
}

const roadmap = readFileSync(join(ROOT, 'docs/engine/PLANNING_INFINITE_DEPTH_ROADMAP.md'), 'utf8');
if (!roadmap.includes('G-∞')) failures.push('roadmap must define G-∞');

if (failures.length) {
  console.error('Infinite depth progress failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ G-∞ Phase A planning artifacts present');
process.exit(0);
