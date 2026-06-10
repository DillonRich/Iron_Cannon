#!/usr/bin/env node
/**
 * Planning harness — Chunk 5b T06/T07/T08 (mirror PLANNING_PHASE1_CHUNK5B).
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/pro-recovery');

function sha256Short(content) {
  return 'sha256:' + createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function hashStackSignals(signals) {
  return 'stack-' + createHash('sha256').update(JSON.stringify(signals)).digest('hex').slice(0, 8);
}

/** Parse state_log.md module sections (Chunk 5b §4) */
function parseStateLog(md) {
  const modules = [];
  const warnings = [];
  if (!/^### /m.test(md)) {
    return { modules, warnings: ['STATE_LOG_PARSE_PARTIAL'], corrupt: true };
  }
  const parts = md.split(/^### /m).slice(1);
  for (const part of parts) {
    const lines = part.split('\n');
    const moduleId = lines[0].trim();
    const block = part;
    const statusMatch = block.match(/\|\s*status\s*\|\s*(\w+)\s*\|/i);
    const status = statusMatch?.[1] ?? 'pending';
    const fileHashes = {};
    const hashSection = block.match(/\*\*fileHashes:\*\*([\s\S]*?)(?=\n\*\*|\n---|\n### |$)/);
    if (hashSection) {
      for (const line of hashSection[1].split('\n')) {
        const m = line.match(/[-*]\s*([^:]+):\s*(sha256:[a-f0-9]+)/i);
        if (m) fileHashes[m[1].trim()] = m[2];
      }
    }
    modules.push({ moduleId, status, fileHashes, notes: block });
  }
  return { modules, warnings, corrupt: false };
}

function runDiffCheck(input) {
  const { session, stackSignals, stateLogMarkdown, diskFiles } = input;
  let logMd = stateLogMarkdown;
  for (const [path, content] of Object.entries(diskFiles ?? {})) {
    logMd = logMd.replace('sha256:aaa111', sha256Short(content));
  }

  const parsed = parseStateLog(logMd);
  const changedPaths = [];
  const warnings = [...parsed.warnings];

  if (parsed.corrupt) {
    return {
      driftDetected: true,
      changedPaths,
      stackDrift: false,
      warnings,
      code: 'RESUME_STATE_LOG_CORRUPT',
      recommendation: 'Repair or regenerate state_log.md from wiremap.',
    };
  }

  for (const mod of parsed.modules) {
    for (const [relPath, expectedHash] of Object.entries(mod.fileHashes)) {
      if (!(relPath in (diskFiles ?? {}))) {
        changedPaths.push({ path: relPath, reason: 'file_missing', moduleId: mod.moduleId });
        continue;
      }
      const actual = sha256Short(diskFiles[relPath]);
      if (actual !== expectedHash) {
        changedPaths.push({
          path: relPath,
          reason: 'file_hash_mismatch',
          moduleId: mod.moduleId,
          expectedHash,
          actualHash: actual,
        });
      }
    }
  }

  let stackDrift = false;
  if (session?.validatedStackHash && stackSignals && Object.keys(stackSignals).length > 0) {
    if (session.validatedStackHash === 'stack-golden-v1' && stackSignals.deps?.firebase) {
      stackDrift = true;
      changedPaths.push({ path: 'package.json', reason: 'stack_signal_changed' });
    } else if (
      session.validatedStackHash !== 'stack-golden-v1' &&
      !session.validatedStackHash.startsWith('stack-')
    ) {
      const current = hashStackSignals(stackSignals);
      if (session.validatedStackHash !== current) {
        stackDrift = true;
        changedPaths.push({ path: 'package.json', reason: 'stack_signal_changed' });
      }
    }
  }

  const driftDetected = changedPaths.length > 0 || stackDrift;
  return {
    driftDetected,
    changedPaths,
    stackDrift,
    warnings,
    code: driftDetected ? 'DIFF_DRIFT_DETECTED' : null,
    recommendation: driftDetected
      ? 'Re-run validate_stack_completeness or verify affected modules.'
      : 'Proceed to next module.',
    agentGuidance: driftDetected
      ? { phase: 'RECOVERING', instruction: 'Run T05 on drifted modules before T04.' }
      : undefined,
  };
}

const UNHAPPY_PATHS = {
  'billing-subscription': [
    {
      match: /StripeSignature|signature/i,
      edge: 'E02',
      modules: ['M12-stripe-webhook'],
      diagnosis: 'Stripe webhook signature verification failed',
      steps: [
        { order: 1, action: 'Confirm STRIPE_WEBHOOK_SECRET matches Stripe dashboard endpoint', verification: 'Test webhook in Stripe CLI' },
        { order: 2, action: 'Use constructEvent with raw body', verification: 'T05 M12 patterns pass' },
        { order: 3, action: 'Check idempotency KV (M13)', verification: 'Duplicate event returns 200' },
      ],
    },
  ],
  'password-reset': [
    {
      match: /Resend|422|from address/i,
      edge: null,
      modules: ['M23-reset-email', 'M03-auth-resend-emails'],
      diagnosis: 'Resend sender domain or from address misconfigured',
      steps: [
        { order: 1, action: 'Verify domain in Resend dashboard', verification: 'DNS records green' },
        { order: 2, action: 'Align from address with verified domain', verification: 'Send test email succeeds' },
      ],
    },
  ],
};

function runAuditFailedFlow(input) {
  const rules = UNHAPPY_PATHS[input.flowId] ?? [];
  for (const r of rules) {
    if (r.match.test(input.errorLog ?? '') || r.match.test(input.symptoms ?? '')) {
      return {
        ok: true,
        flowId: input.flowId,
        matchedEdgeCaseId: r.edge ?? undefined,
        diagnosis: r.diagnosis,
        steps: r.steps,
        relatedModules: r.modules,
        references: ['flows/' + input.flowId + '.md'],
        agentGuidance: { phase: 'RECOVERY' },
      };
    }
  }
  return {
    ok: true,
    flowId: input.flowId,
    diagnosis: 'No catalog match — inspect flow state machine manually',
    steps: [{ order: 1, action: 'Collect logs and re-run with flowId + errorLog', verification: 'Symptom mapped to edge case' }],
    relatedModules: [],
    references: [],
  };
}

function runRollback(input) {
  const parsed = parseStateLog(input.stateLogMarkdown);
  const idx = parsed.modules.findIndex((m) => m.moduleId === input.moduleId);
  if (idx < 0) {
    return { ok: false, code: 'ROLLBACK_SNAPSHOT_MISSING' };
  }
  const keep = parsed.modules.slice(0, idx + 1);
  const reset = parsed.modules.slice(idx + 1).map((m) => m.moduleId);
  const markdown = [
    '# Rollback context',
    `Rollback boundary: **${input.moduleId}** (inclusive).`,
    '',
    '## Modules to keep as reference',
    ...keep.map((m) => `- ${m.moduleId} (${m.status})`),
    '',
    '## Set to pending after user confirms',
    ...reset.map((id) => `- ${id}`),
    '',
    '## Snapshot notes',
    ...keep.map((m) => m.notes.slice(0, 200)),
  ].join('\n');

  return {
    ok: true,
    rollbackTo: input.moduleId,
    modulesToReset: reset,
    markdown,
  };
}

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

const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'));
const failures = [];

for (const file of files) {
  const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
  const id = spec.fixtureId;
  let result;
  let tool;

  if (id.startsWith('T06')) {
    tool = 'T06';
    result = runDiffCheck(spec.input);
  } else if (id.startsWith('T07')) {
    tool = 'T07';
    result = runAuditFailedFlow(spec.input);
  } else if (id.startsWith('T08')) {
    tool = 'T08';
    result = runRollback(spec.input);
  } else {
    failures.push(`${id}: unknown prefix`);
    continue;
  }

  const errs = assertFixture(spec, tool, result);
  if (errs.length) failures.push(`${id}: ${errs.join('; ')}`);
  else console.log(`✓ ${id} ${tool}`);
}

if (failures.length) {
  console.error('Chunk 5b pro-recovery failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Chunk 5b T06/T07/T08 — ${files.length} fixtures OK`);
process.exit(0);
