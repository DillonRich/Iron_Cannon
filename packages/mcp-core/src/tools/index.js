/**
 * MCP tool handlers T01–T14 — G-2 (golden path wired; remainder bridged to planning runtime).
 */
import { loadFixtureSpec, loadModuleFixture } from '../load-fixture.js';
import { readEngineJson } from '../engine-data.js';
import { assertToolAllowed } from '../tier-gate.js';
import {
  mapVulnerabilitySurfaces,
  getSecurityDirectives,
  auditProductionReadiness,
} from './armor.js';
import {
  mapComplianceObligations,
  getComplianceDirectives,
  auditLegalReadiness,
} from './ironclad.js';
import {
  runContinuousDiffCheck,
  auditFailedFlow,
  rollbackToModule,
} from './pro-recovery.js';
import { composeModuleDirective, composeModuleDirectiveAsync } from '../t04-compose.js';
import { validateStackCompleteness } from '@ironcannon/verify';
import { verifyModuleCompliance } from '../t05-verify.js';
import { checkRateLimitAsync } from '../rate-limit.js';
import { enrichError } from '../errors.js';
import { validateApiKey, extractApiKey } from '../api-key.js';
import { assertWiremapAttestation, issueWiremapAttestation } from '../wiremap-attestation.js';
import { createInvokeContext, attachInvokeMeta } from '../observability.js';
import { getRulesetVersion } from '../ruleset.js';
import { checkThrottleLoop } from '../throttle-guard.js';
import { recordToolUsage } from '../usage-telemetry.js';
import {
  resolveWiremapAttestationAsync,
  storeWiremapAttestationAsync,
  recordModuleVerificationAsync,
} from '../session-attestation.js';

let planningSim;
async function getPlanningSim() {
  if (planningSim) return planningSim;
  try {
    if (!import.meta?.url) return null;
    const simUrl = new URL(
      '../../../../scripts/planning-lint/lib/planning-sim-core.mjs',
      import.meta.url,
    );
    planningSim = await import(simUrl.href);
    return planningSim;
  } catch {
    return null;
  }
}

const LOCAL_CLI_ONLY = {
  ok: false,
  error: 'LOCAL_CLI_REQUIRED',
  message: 'T01–T03 run on the developer machine. Use npm run ironcannon or pass results to T04+.',
};

function loadObligationDefault() {
  const idx = readEngineJson('specimens/obligation-index.specimen.json');
  return idx.obligations?.[0]?.id ?? 'LEG-A11Y-001';
}

async function dispatchTool(toolId, ctx, tier) {
  switch (toolId) {
    case 'T01': {
      const sim = await getPlanningSim();
      if (!sim) return LOCAL_CLI_ONLY;
      const { analyzeProjectStack, materializeFixture, cleanupDir } = sim;
      if (ctx.projectPath) {
        const stack = analyzeProjectStack(ctx.projectPath);
        return { ok: true, toolId, stack, rulesetVersion: getRulesetVersion(), projectPath: ctx.projectPath };
      }
      const fixtureId = ctx.fixtureId ?? 'SD-01';
      const spec = loadFixtureSpec('stack-detection', fixtureId);
      if (!spec) return { ok: false, error: 'FIXTURE_NOT_FOUND', message: fixtureId };
      const dir = materializeFixture(spec);
      const stack = analyzeProjectStack(dir);
      cleanupDir(dir);
      return { ok: true, toolId, stack, rulesetVersion: getRulesetVersion() };
    }
    case 'T02': {
      const stack = ctx.stack ?? ctx.body?.stack;
      if (!stack) return { ok: false, error: 'CONTEXT_INSUFFICIENT', message: 'stack required' };
      const v = validateStackCompleteness(stack);
      const SECRET_HINTS = {
        STRIPE_WEBHOOK_SECRET: 'Set via `wrangler secret put STRIPE_WEBHOOK_SECRET` — not scanned from repo files.',
        STRIPE_SECRET_KEY: 'Stripe secret keys belong in wrangler secrets or CI — not committed plaintext.',
        RESEND_API_KEY: 'Resend API key via wrangler secret or env binding — not in static HTML.',
      };
      const completenessHints = (v.missing ?? [])
        .filter((k) => SECRET_HINTS[k])
        .map((key) => ({ key, hint: SECRET_HINTS[key] }));
      return {
        ok: true,
        toolId,
        complete: v.complete,
        missing: v.missing,
        warnings: v.warnings,
        completenessHints,
      };
    }
    case 'T03': {
      const sim = await getPlanningSim();
      if (!sim) return LOCAL_CLI_ONLY;
      const { composeWiremaps } = sim;
      const flowIds = ctx.flowIds ?? ['auth-lifecycle', 'billing-subscription'];
      const wm = composeWiremaps({
        flowIds,
        stackId: ctx.stackId ?? ctx.stack?.stackId,
        wiremapProfile: ctx.wiremapProfile,
      });
      const wiremapAttestation = issueWiremapAttestation({
        wiremaps: wm.wiremaps,
        split: wm.split,
      });
      return {
        ok: true,
        toolId,
        wiremaps: wm.wiremaps,
        split: wm.split,
        phaseGate: wm.meta?.phaseGate ?? 'AWAIT_USER_WIREMAP_APPROVAL',
        wiremapAttestation,
        agentGuidance: {
          phase: 'AWAIT_USER_WIREMAP_APPROVAL',
          instruction:
            'User approves wiremap; pass wiremapAttestation to T04/T05/T11 or set approved: true after review.',
        },
        warnings: wm.warnings ?? [],
        rulesetVersion: getRulesetVersion(),
      };
    }
    case 'T04': {
      const moduleId = ctx.moduleId ?? 'M01-auth-d1-schema';
      const t04Opts = {
        completedModules: ctx.completedModules,
        useRetrieval: ctx.useRetrieval,
        vectorize: ctx.vectorize,
      };
      if (ctx.vectorize) {
        return composeModuleDirectiveAsync(moduleId, tier, t04Opts);
      }
      return composeModuleDirective(moduleId, tier, t04Opts);
    }
    case 'T05': {
      const moduleId = ctx.moduleId ?? 'M01-auth-d1-schema';
      const spec = loadModuleFixture(moduleId);
      if (!spec) return { ok: false, error: 'MODULE_NOT_FOUND', message: moduleId };
      const snippet = ctx.snippet ?? ctx.codeSnippet;
      const audited = Boolean(String(snippet ?? '').trim());
      const v = verifyModuleCompliance(spec, snippet);
      const compliant = audited ? v.compliant : false;
      return {
        ok: true,
        toolId,
        moduleId,
        fixture: spec.fixtureId,
        patterns: spec.patternsUnderTest ?? [],
        compliant,
        audited,
        notAudited: !audited,
        verification: v,
        agentGuidance: !audited
          ? {
              phase: 'VERIFY_NOT_AUDITED',
              instruction:
                'Pass a real code snippet in verify_module_compliance — calibration-only pass is not a production audit.',
            }
          : compliant
            ? { phase: 'VERIFY_PASS', instruction: 'Proceed to next module or re-run T04.' }
            : {
                phase: 'VERIFY_FAIL',
                instruction: 'Fix gaps before T04 next module.',
                missing: v.missing,
              },
      };
    }
    case 'T06':
      return runContinuousDiffCheck({
        session: ctx.session,
        stackSignals: ctx.stackSignals,
        stateLogMarkdown: ctx.stateLogMarkdown,
        diskFiles: ctx.diskFiles,
      });
    case 'T07':
      return auditFailedFlow({
        flowId: ctx.flowId,
        errorLog: ctx.errorLog,
        symptoms: ctx.symptoms,
      });
    case 'T08':
      return rollbackToModule({
        moduleId: ctx.moduleId,
        stateLogMarkdown: ctx.stateLogMarkdown,
      });
    case 'T09':
      return mapVulnerabilitySurfaces({
        surfaceHints: ctx.surfaceHints ?? [{ type: 'webhook' }],
        infraHints: ctx.infraHints,
        includeInfrastructure: ctx.includeInfrastructure,
      });
    case 'T10':
      return getSecurityDirectives({
        surfaceId: ctx.domainId ? undefined : (ctx.surfaceId ?? 'SURF-WH-001'),
        domainId: ctx.domainId,
        tier,
        productionMode: ctx.productionMode ?? false,
        expectedRps: ctx.expectedRps,
        expectedUsers: ctx.expectedUsers,
      });
    case 'T11':
      return auditProductionReadiness({
        wiremapContext: {
          completedModules: ctx.wiremapContext?.completedModules ?? ctx.completedModules ?? [],
          verifiedModules: [
            ...(ctx.wiremapAttestation?.verifiedModules ?? []),
            ...(ctx.wiremapContext?.verifiedModules ?? []),
            ...(ctx.verifiedModules ?? []),
          ],
        },
        confirmedChecklistIds: ctx.confirmedChecklistIds,
        confirmedSecurityModules: ctx.confirmedSecurityModules,
        verifiedInfraDomains: ctx.verifiedInfraDomains,
        autoConfirmInfra: ctx.autoConfirmInfra,
      });
    case 'T12':
      return mapComplianceObligations({ primaryMarkets: ctx.primaryMarkets ?? ['us'] });
    case 'T13':
      return getComplianceDirectives({
        obligationId: ctx.obligationId ?? loadObligationDefault(),
        tier,
        snippet: ctx.snippet ?? ctx.codeSnippet,
      });
    case 'T14':
      return auditLegalReadiness({
        primaryMarkets: ctx.primaryMarkets,
        confirmedObligationIds: ctx.confirmedObligationIds,
        verifiedObligationIds: ctx.verifiedObligationIds,
        autoConfirmOnT13Pass: ctx.autoConfirmOnT13Pass,
      });
    default:
      return { ok: false, error: 'FLOW_NOT_FOUND', message: `Unknown tool ${toolId}` };
  }
}

export async function invokeTool(toolId, ctx = {}) {
  const keyResult = await validateApiKey(
    { ...ctx, apiKey: extractApiKey(ctx) },
    { requireApiKey: ctx.requireApiKey, env: ctx.env, d1: ctx.d1 ?? ctx.env?.DB },
  );
  if (!keyResult.ok) return enrichError(keyResult);

  const tier = keyResult.tier ?? ctx.tier ?? 'pro';
  const clientKey = keyResult.clientId ?? ctx.clientKey ?? ctx.clientId ?? 'anonymous';
  const inv = createInvokeContext({ ...ctx, tier, toolId });

  const sessionOpts = { sessionKv: ctx.sessionKv ?? ctx.env?.SESSION_KV, env: ctx.env };
  const ctxWithAtt = {
    ...ctx,
    tier,
    clientKey,
    wiremapAttestation:
      (await resolveWiremapAttestationAsync({ ...ctx, clientKey }, sessionOpts)) ??
      ctx.wiremapAttestation,
  };

  const attBlock = assertWiremapAttestation(toolId, ctxWithAtt);
  if (attBlock) return enrichError(attBlock);

  const rate = await checkRateLimitAsync(tier, clientKey, { kv: ctx.rateLimitKv });
  if (rate) return enrichError(rate);

  const gate = assertToolAllowed(tier, toolId);
  if (!gate.ok) return enrichError({ ok: false, error: gate.code, message: gate.message });

  const throttle = checkThrottleLoop(clientKey, toolId, ctx.moduleId);
  if (throttle) return enrichError(throttle);

  const result = await dispatchTool(toolId, { ...ctxWithAtt, tier }, tier);

  if (toolId === 'T03' && result?.wiremapAttestation?.token) {
    await storeWiremapAttestationAsync(clientKey, result.wiremapAttestation, sessionOpts);
  }

  if (
    toolId === 'T05' &&
    result?.compliant &&
    result?.audited &&
    result?.moduleId &&
    ctxWithAtt.wiremapAttestation?.token
  ) {
    await recordModuleVerificationAsync(
      clientKey,
      result.moduleId,
      ctxWithAtt.wiremapAttestation,
      sessionOpts,
    );
  }

  const out = result?.error ? enrichError(result) : result;
  const final = attachInvokeMeta(out, inv);

  const durationMs = final.meta?.telemetry?.durationMs;
  recordToolUsage(
    {
      clientId: clientKey,
      toolId,
      tier,
      durationMs,
      ok: final.ok !== false && !final.error,
      errorCode: final.error,
    },
    {
      d1: ctx.d1 ?? ctx.env?.DB,
      env: ctx.env,
      defer: ctx.deferUsage === true,
    },
  ).catch(() => {});

  return final;
}

export const TOOL_IDS = [
  'T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14',
];
