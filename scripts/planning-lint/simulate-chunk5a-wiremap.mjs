#!/usr/bin/env node
/**
 * Planning harness — Chunk 5a T03 wiremap composition (mirror of PLANNING_PHASE1_CHUNK5A).
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/wiremap');

const PAGES_SPLIT_PREFIX = ['M60-pages-wrangler-config', 'M61-pages-env-bridge'];
const SUPABASE_AUTH_PREFIX = ['M70-supabase-auth-config', 'M71-supabase-middleware-ssr'];
const SUPABASE_BILLING_CORE = [
  'M11-stripe-checkout-route',
  'M12-stripe-webhook',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];

const CORE_MODULE_IDS = [
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

const OPTIONAL_FLOW_MODULES = {
  'password-reset': [
    'M20-reset-token-schema',
    'M21-reset-api',
    'M22-reset-ui',
    'M23-reset-email',
  ],
  onboarding: ['M30-onboarding-schema', 'M31-onboarding-api', 'M32-onboarding-ui'],
  'account-deletion': ['M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui'],
};

const CORE_FLOWS = new Set(['auth-lifecycle', 'billing-subscription', 'billing-race-shield', 'email-lifecycle']);

function dedupe(ids) {
  return [...new Set(ids)];
}

function composeWiremaps(input) {
  const flowIds = input.flowIds ?? ['auth-lifecycle', 'billing-subscription'];
  const profile = input.wiremapProfile ?? 'default';
  const stackId = input.stackId ?? input.stack?.stackId;
  const attestation = input.existingModuleIds ?? [];
  const warnings = [];

  if (stackId === 'SD-07' || profile === 'supabase-primary') {
    const moduleIds = [...SUPABASE_AUTH_PREFIX, ...SUPABASE_BILLING_CORE];
    return {
      mode: 'SUPABASE_PRIMARY',
      split: false,
      wiremaps: [{ moduleIds, stackId: 'SD-07', flowIds }],
      warnings: ['supabase-primary-wiremap'],
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL', stackId: 'SD-07' },
    };
  }
  if (stackId === 'SD-06' || profile === 'pages-worker-split') {
    const moduleIds = [...PAGES_SPLIT_PREFIX, ...CORE_MODULE_IDS];
    return {
      mode: 'PAGES_SPLIT',
      split: false,
      wiremaps: [{ moduleIds, stackId: 'SD-06', flowIds }],
      warnings: ['pages-worker-split-wiremap'],
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL', stackId: 'SD-06' },
    };
  }

  const optionalFlows = flowIds.filter((f) => OPTIONAL_FLOW_MODULES[f]);
  const wantsCore = flowIds.some((f) => CORE_FLOWS.has(f)) || flowIds.length === 0;

  let optionalIds = optionalFlows.flatMap((f) => OPTIONAL_FLOW_MODULES[f]);

  if (!wantsCore && attestation.length >= 3 && optionalIds.length > 0) {
    return {
      mode: 'OPTIONAL_ONLY',
      split: false,
      wiremaps: [{ moduleIds: optionalIds, flowIds: optionalFlows }],
      warnings,
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' },
    };
  }

  let coreIds = [...CORE_MODULE_IDS];

  if (optionalFlows.includes('account-deletion') && !flowIds.includes('billing-subscription')) {
    warnings.push('account-deletion-without-billing-flow');
    if (!coreIds.includes('M10-billing-d1-schema')) coreIds.push('M10-billing-d1-schema');
  }

  if (profile === 'compact' && optionalFlows.includes('onboarding')) {
    coreIds = coreIds.filter((id) => id !== 'M16-billing-emails');
    const onboardingIds = OPTIONAL_FLOW_MODULES.onboarding;
    let merged = dedupe([...coreIds, ...onboardingIds]);
    const trimPriority = ['M03-auth-resend-emails', 'M14-billing-success-ui', 'M15-billing-dashboard-ui'];
    for (const drop of trimPriority) {
      if (merged.length <= 12) break;
      if (merged.includes(drop) && !onboardingIds.includes(drop)) {
        merged = merged.filter((id) => id !== drop);
      }
    }
    if (!merged.includes('M32-onboarding-ui')) merged.push('M32-onboarding-ui');
    merged = dedupe(merged).slice(0, 12);
    return {
      mode: 'REPLACE',
      split: false,
      wiremaps: [{ moduleIds: merged, flowIds }],
      warnings,
      meta: { hasTradeoffs: true, phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' },
    };
  }

  const merged = dedupe([...coreIds, ...optionalIds]);

  if (merged.length <= 12) {
    return {
      mode: 'DEFAULT',
      split: false,
      wiremaps: [{ moduleIds: merged, flowIds }],
      warnings,
      meta: { phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' },
    };
  }

  return {
    mode: 'APPEND_SPLIT',
    split: true,
    wiremaps: [
      { label: 'core', moduleIds: coreIds, flowIds: flowIds.filter((f) => CORE_FLOWS.has(f) || !OPTIONAL_FLOW_MODULES[f]) },
      { label: 'extended', moduleIds: optionalIds, flowIds: optionalFlows },
    ],
    warnings,
    meta: { wiremapSplit: true, phaseGate: 'AWAIT_USER_WIREMAP_APPROVAL' },
  };
}

function assertFixture(spec, result) {
  const e = spec.expected;
  const errors = [];

  if (e.split !== undefined && result.split !== e.split) {
    errors.push(`split: got ${result.split}, want ${e.split}`);
  }
  if (e.wiremapCount !== undefined && result.wiremaps.length !== e.wiremapCount) {
    errors.push(`wiremapCount: got ${result.wiremaps.length}, want ${e.wiremapCount}`);
  }
  if (e.coreModuleCount !== undefined) {
    const core = result.wiremaps.find((w) => w.label === 'core') ?? result.wiremaps[0];
    if (core.moduleIds.length !== e.coreModuleCount) {
      errors.push(`coreModuleCount: got ${core.moduleIds.length}, want ${e.coreModuleCount}`);
    }
  }
  if (e.extendedModuleIds) {
    const ext = result.wiremaps.find((w) => w.label === 'extended');
    if (!ext) errors.push('missing extended wiremap');
    else {
      for (const id of e.extendedModuleIds) {
        if (!ext.moduleIds.includes(id)) errors.push(`extended missing ${id}`);
      }
    }
  }
  if (e.moduleIds) {
    const ids = result.wiremaps[0]?.moduleIds ?? [];
    for (const id of e.moduleIds) {
      if (!ids.includes(id)) errors.push(`missing module ${id}`);
    }
  }
  if (e.mustIncludeModuleIds) {
    const ids = result.wiremaps.flatMap((w) => w.moduleIds);
    for (const id of e.mustIncludeModuleIds) {
      if (!ids.includes(id)) errors.push(`must include ${id}`);
    }
  }
  if (e.mustNotIncludeModuleIds) {
    const ids = result.wiremaps.flatMap((w) => w.moduleIds);
    for (const id of e.mustNotIncludeModuleIds) {
      if (ids.includes(id)) errors.push(`must not include ${id}`);
    }
  }
  if (e.maxModuleCount !== undefined) {
    const n = result.wiremaps[0]?.moduleIds?.length ?? 0;
    if (n > e.maxModuleCount) errors.push(`module count ${n} > ${e.maxModuleCount}`);
  }
  if (e.warnings) {
    for (const w of e.warnings) {
      if (!result.warnings.includes(w)) errors.push(`warning missing ${w}`);
    }
  }
  if (e.coreMustIncludeModuleIds && result.split) {
    const core = result.wiremaps.find((w) => w.label === 'core');
    for (const id of e.coreMustIncludeModuleIds) {
      if (!core?.moduleIds.includes(id)) errors.push(`core missing ${id}`);
    }
  }
  if (e.hasTradeoffs && !result.meta?.hasTradeoffs) errors.push('expected hasTradeoffs');
  if (e.mode && result.mode !== e.mode) errors.push(`mode: got ${result.mode}, want ${e.mode}`);
  if (e.moduleCount !== undefined) {
    const n = result.wiremaps[0]?.moduleIds?.length ?? 0;
    if (n !== e.moduleCount) errors.push(`moduleCount: got ${n}, want ${e.moduleCount}`);
  }
  if (e.firstModuleIds) {
    const ids = result.wiremaps[0]?.moduleIds ?? [];
    for (let i = 0; i < e.firstModuleIds.length; i++) {
      if (ids[i] !== e.firstModuleIds[i]) errors.push(`firstModuleIds[${i}]: got ${ids[i]}, want ${e.firstModuleIds[i]}`);
    }
  }
  if (e.phaseGate && result.meta?.phaseGate !== e.phaseGate) {
    errors.push(`phaseGate: got ${result.meta?.phaseGate}, want ${e.phaseGate}`);
  }

  return errors;
}

const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'));
const failures = [];

for (const file of files) {
  const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
  const result = composeWiremaps(spec.input);
  const errs = assertFixture(spec, result);
  if (errs.length) failures.push(`${spec.fixtureId}: ${errs.join('; ')}`);
  else console.log(`✓ ${spec.fixtureId} wiremap`);
}

if (failures.length) {
  console.error('Chunk 5a wiremap simulation failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Chunk 5a T03 wiremap — ${files.length} fixtures OK`);
process.exit(0);
