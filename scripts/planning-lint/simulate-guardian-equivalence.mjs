#!/usr/bin/env node
/**
 * Guardian-style snippet equivalence — T05 + IronClad obligations (G-49+).
 * Usage: npm run planning:guardian-retest
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { verifyModuleCompliance } from '../../packages/mcp-core/src/t05-verify.js';
import { loadModuleFixture } from '../../packages/mcp-core/src/load-fixture.js';
import { verifyObligationSnippet } from '../../packages/mcp-core/src/obligation-verify.js';
import { readEngineJson } from '../../packages/mcp-core/src/engine-data.js';
import {
  materializeFixture,
  cleanupDir,
  analyzeProjectStack,
  stackT02Complete,
} from './lib/planning-sim-core.mjs';
import { loadFixtureSpec } from '../../packages/mcp-core/src/load-fixture.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIX = join(ROOT, 'docs/engine/specimens/fixtures/guardian-equivalence/guardian-style-snippets.json');
const bundle = JSON.parse(readFileSync(FIX, 'utf8'));
const obligations = readEngineJson('specimens/obligation-index.specimen.json');
const failures = [];

for (const c of bundle.cases ?? []) {
  const spec = loadModuleFixture(c.moduleId);
  if (!spec) {
    failures.push(`${c.id}: missing fixture ${c.moduleId}`);
    continue;
  }
  const v = verifyModuleCompliance(spec, c.snippet);
  if (v.compliant !== c.expectCompliant) {
    failures.push(`${c.id} ${c.moduleId}: compliant=${v.compliant} missing=${JSON.stringify(v.missing)}`);
  }
}

for (const c of bundle.obligationCases ?? []) {
  const row = obligations.obligations?.find((o) => o.id === c.obligationId);
  if (!row) {
    failures.push(`${c.id}: obligation ${c.obligationId} not found`);
    continue;
  }
  const v = verifyObligationSnippet(row, c.snippet);
  if (v.compliant !== c.expectCompliant) {
    failures.push(`${c.id} ${c.obligationId}: compliant=${v.compliant} missing=${JSON.stringify(v.missing)}`);
  }
}

for (const [fixtureId, label] of [
  ['SD-06G', 'SD-06G'],
  ['SD-TD', 'SD-TD'],
]) {
  const layoutSpec = loadFixtureSpec('stack-detection', fixtureId);
  if (!layoutSpec) {
    failures.push(`${label} stack-detection fixture missing`);
    continue;
  }
  const dir = materializeFixture(layoutSpec);
  try {
    const stack = analyzeProjectStack(dir);
    const exp = layoutSpec.expectedT01 ?? {};
    if (stack.supported !== exp.supported) {
      failures.push(`${label} supported=${stack.supported} expected=${exp.supported}`);
    }
    if (exp.stackId && stack.stackId !== exp.stackId) {
      failures.push(`${label} stackId=${stack.stackId} expected=${exp.stackId}`);
    }
    for (const svc of exp.services ?? []) {
      if (!stack.services?.includes(svc)) failures.push(`${label} missing service ${svc}`);
    }
    if (!stackT02Complete(stack)) failures.push(`${label} T02 incomplete`);
  } finally {
    cleanupDir(dir);
  }
}

if (failures.length) {
  console.error('Guardian equivalence failures:\n' + failures.join('\n'));
  process.exit(1);
}

const total = (bundle.cases?.length ?? 0) + (bundle.obligationCases?.length ?? 0);
console.log(`✓ Guardian equivalence — ${total}/${total} snippets pass (T05 + obligations)`);
process.exit(0);
