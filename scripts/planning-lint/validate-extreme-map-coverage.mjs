#!/usr/bin/env node
/** EM-0 + EM-1 coverage — golden 12 modules + config count + ref link rate */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONFIG = join(ROOT, 'docs/engine/planning/em0-config-nodes.json');
const STEPS_EM0 = join(ROOT, 'docs/engine/planning/em0-flow-steps.json');
const STEPS_EM1 = join(ROOT, 'docs/engine/planning/em1-flow-steps.json');
const MANIFEST = join(ROOT, 'docs/engine/phase1/rules-manifest.json');

const GOLDEN_12 = [
  'M01-auth-d1-schema',
  'M02-auth-worker-routes',
  'M03-auth-resend-emails',
  'M04-auth-ui-routes',
  'M05-auth-session-middleware',
  'M10-billing-d1-schema',
  'M11-stripe-checkout-route',
  'M12-stripe-webhook',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];

const MIN_CONFIG = 500;
const MIN_FLOW_STEPS = 2200;
const MIN_REF_RATE = 0.8;

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
const steps = existsSync(STEPS_EM1)
  ? JSON.parse(readFileSync(STEPS_EM1, 'utf8'))
  : JSON.parse(readFileSync(STEPS_EM0, 'utf8'));
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

const failures = [];
if (config.nodeCount < MIN_CONFIG) {
  failures.push(`config nodes ${config.nodeCount} < ${MIN_CONFIG}`);
}
if ((steps.nodeCount ?? steps.nodes?.length ?? 0) < MIN_FLOW_STEPS) {
  failures.push(`flow steps ${steps.nodeCount ?? steps.nodes.length} < ${MIN_FLOW_STEPS}`);
}

const withRefs = config.nodes.filter((n) => n.referenceRefIds?.length > 0).length;
const refRate = withRefs / config.nodes.length;
if (refRate < MIN_REF_RATE) {
  failures.push(`ref link rate ${(refRate * 100).toFixed(1)}% < ${MIN_REF_RATE * 100}%`);
}

const stepModules = new Set();
for (const n of steps.nodes) {
  for (const m of n.moduleIds ?? []) stepModules.add(m);
}
for (const mod of GOLDEN_12) {
  if (!stepModules.has(mod)) failures.push(`golden module missing flow_step: ${mod}`);
}

const manifestMods = Object.keys(manifest.modules);
for (const mod of GOLDEN_12) {
  if (!manifestMods.includes(mod)) failures.push(`manifest missing ${mod}`);
}

if (failures.length) {
  console.error('Extreme map coverage failures:');
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
const stepCount = steps.nodeCount ?? steps.nodes.length;
console.log(
  `✓ Extreme map — ${config.nodeCount} config, ${stepCount} flow steps, ref ${(refRate * 100).toFixed(1)}%, golden 12 covered`,
);
process.exit(0);
