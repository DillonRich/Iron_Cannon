#!/usr/bin/env node
/** T06–T08 — all pro-recovery fixture specs via mcp-core */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { invokeTool } from '../packages/mcp-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/pro-recovery');

function assertFixture(spec, tool, result) {
  const e = spec.expected;
  const errors = [];

  if (tool === 'T06') {
    if (e.driftDetected !== undefined && result.driftDetected !== e.driftDetected) {
      errors.push(`driftDetected: ${result.driftDetected} != ${e.driftDetected}`);
    }
    if (e.code !== undefined && result.code !== e.code) errors.push(`code: ${result.code} != ${e.code}`);
    if (e.code === null && result.code != null) errors.push(`expected no code, got ${result.code}`);
    if (e.changedPathsCount !== undefined && result.changedPaths.length !== e.changedPathsCount) {
      errors.push(`changedPaths: ${result.changedPaths.length} != ${e.changedPathsCount}`);
    }
    if (e.reasons) {
      for (const r of e.reasons) {
        if (!result.changedPaths.some((c) => c.reason === r)) errors.push(`missing reason ${r}`);
      }
    }
    if (e.moduleId && !result.changedPaths.some((c) => c.moduleId === e.moduleId)) {
      errors.push(`missing moduleId ${e.moduleId}`);
    }
    if (e.stackDrift && !result.stackDrift) errors.push('expected stackDrift');
    if (e.warnings) {
      for (const w of e.warnings) {
        if (!result.warnings?.includes(w)) errors.push(`missing warning ${w}`);
      }
    }
  }

  if (tool === 'T07') {
    if (e.matchedEdgeCaseId && result.matchedEdgeCaseId !== e.matchedEdgeCaseId) {
      errors.push(`edge: ${result.matchedEdgeCaseId} != ${e.matchedEdgeCaseId}`);
    }
    if (e.relatedModules) {
      for (const m of e.relatedModules) {
        if (!result.relatedModules?.includes(m)) errors.push(`missing related ${m}`);
      }
    }
    if (e.stepsMin && (result.steps?.length ?? 0) < e.stepsMin) errors.push('steps too few');
    if (e.diagnosisContains && !result.diagnosis?.includes(e.diagnosisContains)) {
      errors.push(`diagnosis missing ${e.diagnosisContains}`);
    }
  }

  if (tool === 'T08') {
    if (e.ok !== undefined && result.ok !== e.ok) errors.push(`ok: ${result.ok}`);
    if (e.code && result.code !== e.code) errors.push(`code ${result.code}`);
    if (e.rollbackTo && result.rollbackTo !== e.rollbackTo) errors.push('rollbackTo mismatch');
    if (e.modulesToReset) {
      for (const m of e.modulesToReset) {
        if (!result.modulesToReset?.includes(m)) errors.push(`reset missing ${m}`);
      }
    }
    if (e.markdownContains) {
      for (const s of e.markdownContains) {
        if (!result.markdown?.includes(s)) errors.push(`markdown missing ${s}`);
      }
    }
  }

  return errors;
}

const failures = [];
for (const file of readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'))) {
  const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
  const id = spec.fixtureId;
  let tool;
  let result;

  if (id.startsWith('T06')) {
    tool = 'T06';
    result = await invokeTool('T06', { tier: 'pro', ...spec.input });
  } else if (id.startsWith('T07')) {
    tool = 'T07';
    result = await invokeTool('T07', { tier: 'pro', ...spec.input });
  } else if (id.startsWith('T08')) {
    tool = 'T08';
    result = await invokeTool('T08', { tier: 'pro', ...spec.input });
  } else {
    failures.push(`${id}: unknown prefix`);
    continue;
  }

  const errs = assertFixture(spec, tool, result);
  if (errs.length) failures.push(`${id}: ${errs.join('; ')}`);
}

if (failures.length) {
  console.error('G-2 recovery fixtures FAILED:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ G-2 recovery fixtures — T06/T07/T08 all pro-recovery specs');
process.exit(0);
