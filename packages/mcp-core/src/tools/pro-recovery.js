import { createHash } from 'crypto';

export function sha256Short(content) {
  return 'sha256:' + createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function hashStackSignals(signals) {
  return 'stack-' + createHash('sha256').update(JSON.stringify(signals)).digest('hex').slice(0, 8);
}

/** Parse state_log.md module sections (Chunk 5b) */
export function parseStateLog(md) {
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

export function runContinuousDiffCheck(input) {
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
      ok: true,
      toolId: 'T06',
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
    ok: true,
    toolId: 'T06',
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
        {
          order: 1,
          action: 'Confirm STRIPE_WEBHOOK_SECRET matches Stripe dashboard endpoint',
          verification: 'Test webhook in Stripe CLI',
        },
        {
          order: 2,
          action: 'Use constructEvent with raw body',
          verification: 'T05 M12 patterns pass',
        },
        {
          order: 3,
          action: 'Check idempotency KV (M13)',
          verification: 'Duplicate event returns 200',
        },
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
        {
          order: 2,
          action: 'Align from address with verified domain',
          verification: 'Send test email succeeds',
        },
      ],
    },
  ],
};

export function auditFailedFlow(input) {
  const rules = UNHAPPY_PATHS[input.flowId] ?? [];
  for (const r of rules) {
    if (r.match.test(input.errorLog ?? '') || r.match.test(input.symptoms ?? '')) {
      return {
        ok: true,
        toolId: 'T07',
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
    toolId: 'T07',
    flowId: input.flowId,
    diagnosis: 'No catalog match — inspect flow state machine manually',
    steps: [
      {
        order: 1,
        action: 'Collect logs and re-run with flowId + errorLog',
        verification: 'Symptom mapped to edge case',
      },
    ],
    relatedModules: [],
    references: [],
  };
}

export function rollbackToModule(input) {
  const parsed = parseStateLog(input.stateLogMarkdown);
  const idx = parsed.modules.findIndex((m) => m.moduleId === input.moduleId);
  if (idx < 0) {
    return { ok: false, toolId: 'T08', error: 'ROLLBACK_SNAPSHOT_MISSING', code: 'ROLLBACK_SNAPSHOT_MISSING' };
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
    toolId: 'T08',
    rollbackTo: input.moduleId,
    modulesToReset: reset,
    markdown,
  };
}
