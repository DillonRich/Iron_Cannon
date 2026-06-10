#!/usr/bin/env node
/**
 * MCP E2E golden path — planning proof (no network).
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  analyzeProjectStack,
  materializeFixture,
  cleanupDir,
  stackT02Complete,
  composeWiremaps,
} from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PATH_REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/e2e-golden-path.json'), 'utf8'),
);
const BUNDLE = JSON.parse(
  readFileSync(
    join(ROOT, 'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json'),
    'utf8',
  ),
);
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'),
);

const errors = [];
const FIX = {
  stack: join(ROOT, 'docs/engine/specimens/fixtures/stack-detection'),
  wiremap: join(ROOT, 'docs/engine/specimens/fixtures/wiremap'),
  modules: join(ROOT, 'docs/engine/specimens/fixtures/modules'),
};

function loadFixture(dir, fixtureId) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.fixture-spec.json'))) {
    const spec = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (spec.fixtureId === fixtureId) return spec;
  }
  return null;
}

// T01 SD-01
const sd01 = loadFixture(FIX.stack, 'SD-01');
if (!sd01) errors.push('SD-01 stack fixture missing');
else {
  const dir = materializeFixture(sd01);
  const stack = analyzeProjectStack(dir);
  cleanupDir(dir);
  if (!stack.supported) errors.push('T01 SD-01: expected supported stack');
  if (!stackT02Complete(stack)) errors.push('T02: SD-01 stack incomplete');
}

// T03 golden core wiremap (12 modules, no split)
const wm = composeWiremaps({ flowIds: ['auth-lifecycle', 'billing-subscription'] });
const ids = wm.wiremaps?.[0]?.moduleIds ?? [];
if (ids.length !== 12) errors.push(`T03 golden: expected 12 modules got ${ids.length}`);
if (wm.split) errors.push('T03 golden: unexpected wiremap split');
const w01 = loadFixture(FIX.wiremap, 'W01');
if (!w01) errors.push('W01 optional-flow wiremap fixture missing');

// T04 bundle chain
const order = BUNDLE.moduleOrder ?? [];
for (const moduleId of order) {
  if (!MANIFEST.modules[moduleId]) errors.push(`manifest missing ${moduleId}`);
  const mod = BUNDLE.modules[moduleId];
  if (!mod?.expected?.requiredPatternIds?.length) errors.push(`${moduleId}: outbound patterns`);
}

// T05 fixtures per module
for (const moduleId of order) {
  const fixName = `${moduleId}.fixture-spec.json`;
  const p = join(FIX.modules, fixName);
  if (!existsSync(p)) errors.push(`T05 fixture missing ${fixName}`);
}

// 14 tools in scale profiles
const scale = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/scale-profiles.specimen.json'), 'utf8'),
);
const toolsNeeded = ['T01', 'T02', 'T03', 'T04', 'T05', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14'];
for (const t of toolsNeeded) {
  if (!scale.profiles.some((p) => p.tool === t)) errors.push(`scale profile missing ${t}`);
}

if (errors.length) {
  console.error('MCP E2E golden path failures:\n' + errors.join('\n'));
  process.exit(1);
}

console.log(
  `✓ MCP E2E golden path — T01→T03(${order.length} modules)→T04 bundle→T05 fixtures (${PATH_REG.chainId})`,
);

import { spawnSync } from 'child_process';
const rt = spawnSync('node', ['scripts/planning-lint/simulate-mcp-e2e-golden-packages.mjs'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: true,
});
if (rt.status !== 0) {
  console.error((rt.stderr || rt.stdout || '').slice(-1500));
  process.exit(1);
}
console.log((rt.stdout || '').trim());
process.exit(0);
