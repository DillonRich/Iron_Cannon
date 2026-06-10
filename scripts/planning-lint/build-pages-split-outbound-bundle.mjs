#!/usr/bin/env node
/** Build SD-06 pages-split outbound bundle — M60→M61→golden M01–M16. */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const GOLDEN = join(ROOT, 'docs/engine/specimens/fixtures/e2e/golden-path-outbound.bundle.json');
const OUT = join(ROOT, 'docs/engine/specimens/fixtures/e2e/pages-split-outbound.bundle.json');

const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));
const moduleOrder = [
  'M60-pages-wrangler-config',
  'M61-pages-env-bridge',
  ...(golden.moduleOrder ?? []),
];

const modules = { ...golden.modules };

modules['M60-pages-wrangler-config'] = {
  fixtureId: 'GP-M60-OUT',
  tool: 'T04',
  moduleId: 'M60-pages-wrangler-config',
  tier: 'pro',
  rulesetVersion: golden.rulesetVersion,
  flowId: 'auth-lifecycle',
  fragmentIds: ['layer2/pages/wrangler-config'],
  expected: {
    ok: true,
    requiredResponseKeys: ['moduleId', 'directives', 'meta', 'agentGuidance', 'verifyBeforeProceed'],
    requiredPatternIds: ['PAGES-CFG-001', 'PAGES-CFG-002'],
    minRuleFragments: 1,
    minMapNodes: 0,
    requiredRefIds: ['cloudflare/knowledge-w78-pages-build-output-dir', 'cloudflare/pages-functions-wrangler-configuration-index'],
    maxOutboundTokens: 16000,
    sliceProfile: 'module_directive',
    nextModuleId: 'M61-pages-env-bridge',
    verifyGateBlocksNext: true,
  },
};

modules['M61-pages-env-bridge'] = {
  fixtureId: 'GP-M61-OUT',
  tool: 'T04',
  moduleId: 'M61-pages-env-bridge',
  tier: 'pro',
  rulesetVersion: golden.rulesetVersion,
  flowId: 'auth-lifecycle',
  fragmentIds: ['layer2/pages/env-bridge'],
  expected: {
    ok: true,
    requiredResponseKeys: ['moduleId', 'directives', 'meta', 'agentGuidance', 'verifyBeforeProceed'],
    requiredPatternIds: ['PAGES-ENV-001', 'PAGES-ENV-002'],
    minRuleFragments: 1,
    minMapNodes: 0,
    requiredRefIds: ['nextjs/knowledge-w78-public-api-url', 'ironcannon/knowledge-w78-middleware-pages-split'],
    maxOutboundTokens: 16000,
    sliceProfile: 'module_directive',
    nextModuleId: 'M01-auth-d1-schema',
    verifyGateBlocksNext: true,
  },
};

if (modules['M01-auth-d1-schema']?.expected) {
  modules['M01-auth-d1-schema'].expected = {
    ...modules['M01-auth-d1-schema'].expected,
    prevModuleId: 'M61-pages-env-bridge',
  };
}

for (let i = 0; i < moduleOrder.length; i++) {
  const id = moduleOrder[i];
  const next = moduleOrder[i + 1] ?? null;
  if (modules[id]?.expected) modules[id].expected.nextModuleId = next;
}

const bundle = {
  $schema: 'https://ironcannon.dev/schemas/golden-path-outbound-bundle/v1',
  chainId: 'GP-PAGES-SPLIT-06',
  description: 'SD-06 Pages+Worker split — M60→M61→M01–M16',
  rulesetVersion: golden.rulesetVersion,
  stackId: 'SD-06',
  moduleOrder,
  modules,
};

writeFileSync(OUT, JSON.stringify(bundle, null, 2) + '\n');
console.log(`✓ Pages-split outbound bundle — ${moduleOrder.length} modules (SD-06)`);
