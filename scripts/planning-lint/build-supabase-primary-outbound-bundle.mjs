#!/usr/bin/env node
/** Build SD-07 supabase-primary outbound bundle — M70→M71→billing M11–M16. */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const GOLDEN = join(ROOT, 'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json');
const OUT = join(ROOT, 'docs/engine/specimens/fixtures/e2e/supabase-primary-outbound.bundle.json');

const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));
const billingIds = [
  'M11-stripe-checkout-route',
  'M12-stripe-webhook',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];
const moduleOrder = ['M70-supabase-auth-config', 'M71-supabase-middleware-ssr', ...billingIds];

const modules = {};
for (const id of billingIds) {
  if (golden.modules?.[id]) modules[id] = JSON.parse(JSON.stringify(golden.modules[id]));
}

modules['M70-supabase-auth-config'] = {
  fixtureId: 'GP-M70-OUT',
  tool: 'T04',
  moduleId: 'M70-supabase-auth-config',
  tier: 'pro',
  rulesetVersion: golden.rulesetVersion,
  flowId: 'auth-lifecycle',
  fragmentIds: ['layer2/supabase/auth-config'],
  expected: {
    ok: true,
    requiredResponseKeys: ['moduleId', 'directives', 'meta', 'agentGuidance', 'verifyBeforeProceed'],
    requiredPatternIds: ['SUPA-CFG-001', 'SUPA-CFG-002'],
    minRuleFragments: 1,
    minMapNodes: 0,
    requiredRefIds: ['supabase/knowledge-w80-anon-client-browser', 'supabase/knowledge-w80-rls-enable-policies'],
    maxOutboundTokens: 16000,
    sliceProfile: 'module_directive',
    nextModuleId: 'M71-supabase-middleware-ssr',
    verifyGateBlocksNext: true,
  },
};

modules['M71-supabase-middleware-ssr'] = {
  fixtureId: 'GP-M71-OUT',
  tool: 'T04',
  moduleId: 'M71-supabase-middleware-ssr',
  tier: 'pro',
  rulesetVersion: golden.rulesetVersion,
  flowId: 'auth-lifecycle',
  fragmentIds: ['layer2/supabase/middleware-ssr'],
  expected: {
    ok: true,
    requiredResponseKeys: ['moduleId', 'directives', 'meta', 'agentGuidance', 'verifyBeforeProceed'],
    requiredPatternIds: ['SUPA-MW-001', 'SUPA-MW-002'],
    minRuleFragments: 1,
    minMapNodes: 0,
    requiredRefIds: ['supabase/knowledge-w80-ssr-middleware-session', 'nextjs/knowledge-w80-middleware-cookie-bridge'],
    maxOutboundTokens: 16000,
    sliceProfile: 'module_directive',
    nextModuleId: 'M11-stripe-checkout-route',
    verifyGateBlocksNext: true,
  },
};

if (modules['M11-stripe-checkout-route']?.expected) {
  modules['M11-stripe-checkout-route'].expected = {
    ...modules['M11-stripe-checkout-route'].expected,
    prevModuleId: 'M71-supabase-middleware-ssr',
  };
}

for (let i = 0; i < moduleOrder.length; i++) {
  const id = moduleOrder[i];
  const next = moduleOrder[i + 1] ?? null;
  if (modules[id]?.expected) modules[id].expected.nextModuleId = next;
}

const bundle = {
  $schema: 'https://ironcannon.dev/schemas/golden-path-outbound-bundle/v1',
  chainId: 'GP-SUPABASE-PRIMARY-07',
  description: 'SD-07 Supabase-primary — M70→M71→M11–M16',
  rulesetVersion: golden.rulesetVersion,
  stackId: 'SD-07',
  moduleOrder,
  modules,
};

writeFileSync(OUT, JSON.stringify(bundle, null, 2) + '\n');
console.log(`✓ Supabase-primary outbound bundle — ${moduleOrder.length} modules (SD-07)`);
