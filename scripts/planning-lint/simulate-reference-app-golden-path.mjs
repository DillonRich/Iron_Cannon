#!/usr/bin/env node
/**
 * Starter-scope agent golden path on real reference app code:
 * T01(projectPath) → T02 → T03 → T04/T05×12 with file snippets.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { invokeTool } from './lib/mcp-invoke.mjs';
import {
  REFERENCE_APP_DIR,
  MODULE_FILES,
  GOLDEN_MODULE_ORDER,
} from './lib/golden-reference-app-modules.mjs';

const failures = [];

const t01 = await invokeTool('T01', { projectPath: REFERENCE_APP_DIR, tier: 'pro' });
if (!t01.stack?.supported) failures.push('T01: stack not supported');
const t02 = await invokeTool('T02', { stack: t01.stack, tier: 'pro' });
if (!t02.complete) failures.push(`T02: incomplete missing=${JSON.stringify(t02.missing)}`);

const t03 = await invokeTool('T03', { tier: 'pro' });
const att = t03.wiremapAttestation;
if (!att?.token) failures.push('T03: no wiremapAttestation');

const completed = [];
for (const moduleId of GOLDEN_MODULE_ORDER) {
  const rel = MODULE_FILES[moduleId];
  const full = join(REFERENCE_APP_DIR, rel);
  if (!existsSync(full)) {
    failures.push(`${moduleId}: missing ${rel}`);
    continue;
  }
  const snippet = readFileSync(full, 'utf8');
  const t04 = await invokeTool('T04', {
    moduleId,
    tier: 'pro',
    completedModules: [...completed],
    wiremapAttestation: att,
  });
  if (!t04.ok) failures.push(`${moduleId} T04: ${t04.error ?? 'failed'}`);

  const t05 = await invokeTool('T05', {
    moduleId,
    tier: 'pro',
    wiremapAttestation: att,
    snippet,
  });
  if (!t05.compliant) failures.push(`${moduleId} T05: not compliant`);
  else completed.push(moduleId);
}

if (failures.length) {
  console.error('Reference app golden path failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ Reference app golden path — T01→T02→T03→T04/T05 on ${completed.length} modules with real file snippets`,
);
process.exit(0);
