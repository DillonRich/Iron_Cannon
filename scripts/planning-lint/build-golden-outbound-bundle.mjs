#!/usr/bin/env node
/**
 * Builds golden-path T04 outbound expectation bundle from rules-manifest + module fixtures.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'),
);
const SCALE = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/scale-profiles.specimen.json'), 'utf8'),
);
const FIX_DIR = join(ROOT, 'docs/engine/specimens/fixtures/modules');

const ORDER = [
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

const FIXTURE_FILE = {
  'M01-auth-d1-schema': 'M01-auth-d1-schema.fixture-spec.json',
  'M02-auth-worker-routes': 'M02-auth-worker-routes.fixture-spec.json',
  'M03-auth-resend-emails': 'M03-auth-resend-emails.fixture-spec.json',
  'M04-auth-ui-routes': 'M04-auth-ui-routes.fixture-spec.json',
  'M05-auth-session-middleware': 'M05-auth-session-middleware.fixture-spec.json',
  'M10-billing-d1-schema': 'M10-billing-d1-schema.fixture-spec.json',
  'M11-stripe-checkout-route': 'M11-stripe-checkout-route.fixture-spec.json',
  'M12-stripe-webhook': 'M12-stripe-webhook.fixture-spec.json',
  'M13-provisioning-kv': 'M13-provisioning-kv.fixture-spec.json',
  'M14-billing-success-ui': 'M14-billing-success-ui.fixture-spec.json',
  'M15-billing-dashboard-ui': 'M15-billing-dashboard-ui.fixture-spec.json',
  'M16-billing-emails': 'M16-billing-emails.fixture-spec.json',
};

const t04Profile = SCALE.profiles.find((p) => p.tool === 'T04');

function loadSpecimen(moduleId) {
  const entry = MANIFEST.modules[moduleId];
  if (!entry?.specimenPath) return null;
  const path = join(ROOT, 'docs/engine', entry.specimenPath);
  return JSON.parse(readFileSync(path, 'utf8'));
}

const modules = {};
for (let i = 0; i < ORDER.length; i++) {
  const moduleId = ORDER[i];
  const fix = JSON.parse(readFileSync(join(FIX_DIR, FIXTURE_FILE[moduleId]), 'utf8'));
  const spec = loadSpecimen(moduleId);
  const refs = spec?.references ?? spec?.content?.references ?? [];
  const patterns =
    spec?.compliancePatterns?.required?.map((p) => p.id) ?? fix.patternsUnderTest ?? [];
  modules[moduleId] = {
    fixtureId: `GP-${fix.fixtureId}-OUT`,
    tool: 'T04',
    moduleId,
    tier: 'pro',
    rulesetVersion: MANIFEST.rulesetVersion,
    flowId: MANIFEST.modules[moduleId].flowId,
    fragmentIds: MANIFEST.modules[moduleId].fragmentIds,
    expected: {
      ok: true,
      requiredResponseKeys: ['moduleId', 'directives', 'meta', 'agentGuidance', 'verifyBeforeProceed'],
      requiredPatternIds: patterns.slice(0, 8),
      minRuleFragments: 1,
      minMapNodes: 0,
      requiredRefIds: refs.slice(0, 6),
      maxOutboundTokens: t04Profile?.maxOutboundTokens ?? 16000,
      sliceProfile: 'module_directive',
      nextModuleId: i < ORDER.length - 1 ? ORDER[i + 1] : null,
      verifyGateBlocksNext: true,
    },
  };
}

const bundle = {
  $schema: 'https://ironcannon.dev/schemas/golden-path-outbound-bundle/v1',
  chainId: 'GP-GOLDEN-01',
  description: 'Golden stack T04 outbound expectations M01→M16',
  rulesetVersion: MANIFEST.rulesetVersion,
  moduleOrder: ORDER,
  modules,
};

const outDir = join(ROOT, 'docs/engine/specimens/fixtures/e2e');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'golden-path-outbound.bundle.json');
writeFileSync(outPath, JSON.stringify(bundle, null, 2) + '\n');
console.log(`✓ Wrote ${outPath} (${ORDER.length} modules)`);
