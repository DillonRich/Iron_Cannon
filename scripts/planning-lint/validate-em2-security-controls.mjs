#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const em2Path = join(ROOT, 'docs/engine/planning/em2-security-controls.json');

if (!existsSync(em2Path)) {
  console.error('Missing em2-security-controls.json — run: npm run planning:build-em2');
  process.exit(1);
}

const em2 = JSON.parse(readFileSync(em2Path, 'utf8'));
const em1 = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/em1-flow-steps.json'), 'utf8'));
const registry = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);

const MIN_CONTROLS = 600;
const MIN_PROTOCOLS = 550;
const failures = [];

if ((registry.protocols?.length ?? 0) < MIN_PROTOCOLS) {
  failures.push(`security-protocol-registry: need ≥${MIN_PROTOCOLS}, got ${registry.protocols?.length}`);
}
if (em2.controlCount < MIN_CONTROLS) {
  failures.push(`em2 controls: need ≥${MIN_CONTROLS}, got ${em2.controlCount}`);
}

const buildSteps = em1.nodes.filter((n) => n.phase === 'BUILD');
const covered = new Set(em2.controls.map((c) => c.flowStepId));
const uncovered = buildSteps.filter((n) => !covered.has(n.nodeId));
if (uncovered.length > buildSteps.length * 0.2) {
  failures.push(`>20% BUILD steps lack controls: ${uncovered.length}/${buildSteps.length}`);
}

if (failures.length) {
  console.error('EM-2 validation failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ EM-2 — ${em2.controlCount} controls, ${registry.protocols.length} protocols`);
process.exit(0);
