#!/usr/bin/env node
/**
 * Chunk 19 — golden-path T04 outbound bundle vs manifest + module fixtures.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BUNDLE_PATH = join(
  ROOT,
  'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json',
);
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'),
);

if (!existsSync(BUNDLE_PATH)) {
  console.error('Missing bundle — run: node scripts/planning-lint/build-golden-outbound-bundle.mjs');
  process.exit(1);
}

const bundle = JSON.parse(readFileSync(BUNDLE_PATH, 'utf8'));
const errors = [];

if (bundle.rulesetVersion !== MANIFEST.rulesetVersion) {
  errors.push(`rulesetVersion mismatch bundle vs manifest`);
}

const order = bundle.moduleOrder ?? [];
for (let i = 0; i < order.length; i++) {
  const moduleId = order[i];
  const mod = bundle.modules[moduleId];
  if (!mod) {
    errors.push(`${moduleId}: missing in bundle`);
    continue;
  }
  if (!MANIFEST.modules[moduleId]) errors.push(`${moduleId}: not in manifest`);
  const exp = mod.expected ?? {};
  if (mod.tool !== 'T04') errors.push(`${moduleId}: tool must be T04`);
  for (const key of exp.requiredResponseKeys ?? []) {
    if (!key) errors.push(`${moduleId}: empty requiredResponseKey`);
  }
  if ((exp.requiredPatternIds?.length ?? 0) < 1) {
    errors.push(`${moduleId}: requiredPatternIds empty`);
  }
  const wantNext = i < order.length - 1 ? order[i + 1] : null;
  if (exp.nextModuleId !== wantNext) {
    errors.push(`${moduleId}: nextModuleId ${exp.nextModuleId} expected ${wantNext}`);
  }
  if (exp.maxOutboundTokens > 20000) errors.push(`${moduleId}: maxOutboundTokens too high`);
}

if (errors.length) {
  console.error('Chunk 19 outbound failures:\n' + errors.join('\n'));
  process.exit(1);
}

console.log(`✓ Chunk 19 module outbound — ${order.length} modules chained GP-GOLDEN-01`);
process.exit(0);
