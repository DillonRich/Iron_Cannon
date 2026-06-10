#!/usr/bin/env node
/**
 * Full tiered golden path — Pro (12 modules) + Armor (T09–T11) + IronClad (T12–T14).
 */
import { invokeTool } from '../packages/mcp-core/src/index.js';
import { loadModuleFixture } from '../packages/mcp-core/src/load-fixture.js';

const errors = [];

const t01 = await invokeTool('T01', { fixtureId: 'SD-01', tier: 'pro' });
if (!t01.ok || !t01.stack?.supported) errors.push('T01');

const t02 = await invokeTool('T02', { stack: t01.stack, tier: 'pro' });
if (!t02.ok || !t02.complete) errors.push('T02');

const t03 = await invokeTool('T03', { tier: 'pro' });
const ids = t03.wiremaps?.[0]?.moduleIds ?? [];
const att = t03.wiremapAttestation;
if (!t03.ok || ids.length !== 12 || !att?.token) errors.push(`T03 modules=${ids.length}`);

const completed = [];
const verified = [];
for (const moduleId of ids) {
  const t04 = await invokeTool('T04', {
    moduleId,
    tier: 'pro',
    completedModules: [...completed],
    wiremapAttestation: att,
  });
  if (!t04.ok) {
    errors.push(`T04 ${moduleId}`);
    break;
  }
  const spec = loadModuleFixture(moduleId);
  const t05 = await invokeTool('T05', {
    moduleId,
    tier: 'pro',
    wiremapAttestation: att,
    snippet: spec?.passSnippet,
  });
  if (!t05.ok || !t05.compliant || t05.notAudited) errors.push(`T05 ${moduleId}`);
  if (t05.compliant) verified.push(moduleId);
  completed.push(moduleId);
}

for (const armorModule of ['A02-session-hardening-pass', 'A03-webhook-hardening-pass']) {
  const spec = loadModuleFixture(armorModule);
  const t05a = await invokeTool('T05', {
    moduleId: armorModule,
    tier: 'armor',
    wiremapAttestation: att,
    snippet: spec?.passSnippet,
  });
  if (!t05a.ok || !t05a.compliant || t05a.notAudited) errors.push(`T05 ${armorModule}`);
  if (t05a.compliant) verified.push(armorModule);
  completed.push(armorModule);
}

const t09 = await invokeTool('T09', {
  tier: 'armor',
  surfaceHints: [{ type: 'webhook' }, { type: 'session' }],
});
if (!t09.ok || !(t09.surfaces?.length >= 1) || !(t09.infrastructure?.length >= 6)) {
  errors.push('T09 armor map');
}

const t10sec = await invokeTool('T10', { tier: 'armor', surfaceId: 'SURF-WH-001' });
if (!t10sec.ok || !t10sec.directives) errors.push('T10 SURF-WH-001');

const t10infra = await invokeTool('T10', {
  tier: 'armor',
  domainId: 'INFRA-CACHE',
  expectedRps: 500,
});
if (!t10infra.ok || !t10infra.checklist?.length) errors.push('T10 INFRA-CACHE');

const t11blocked = await invokeTool('T11', {
  tier: 'armor',
  wiremapAttestation: att,
  wiremapContext: { completedModules: ids },
  autoConfirmInfra: false,
});
if (t11blocked.ready) errors.push('T11 should block before armor + infra confirm');

const t11 = await invokeTool('T11', {
  tier: 'armor',
  wiremapAttestation: att,
  wiremapContext: { completedModules: completed, verifiedModules: verified },
  autoConfirmInfra: true,
  verifiedInfraDomains: ['INFRA-CACHE', 'INFRA-RATE-LIMIT', 'INFRA-CAPACITY', 'INFRA-STRESS'],
  confirmedChecklistIds: [
    'cache-rules-explicit',
    'per-ip-limits',
    'rps-budget',
    'baseline-load-test',
  ],
});
if (!t11.ok || !t11.securityReady || !t11.infraReady || !t11.ready) {
  errors.push(`T11 ready=${t11.ready} sec=${t11.securityReady} infra=${t11.infraReady}`);
}

const t12 = await invokeTool('T12', { tier: 'ironclad', primaryMarkets: ['us', 'eu'] });
if (!t12.ok || t12.obligationCount < 10 || !t12.legalDisclaimer) errors.push('T12');

const t13 = await invokeTool('T13', {
  tier: 'ironclad',
  obligationId: 'LEG-A11Y-001',
  snippet: '<img alt="x" src="/a.png" />',
});
if (!t13.ok || t13.verification?.compliant !== true) errors.push('T13 verify');

const required = (t12.obligations ?? []).filter((o) => o.severity === 'required' || !o.severity);
const t14open = await invokeTool('T14', {
  tier: 'ironclad',
  primaryMarkets: ['us', 'eu'],
  confirmedObligationIds: [],
});
if (!t14open.ok || t14open.ready) errors.push('T14 should block with zero confirmed');

const t14 = await invokeTool('T14', {
  tier: 'ironclad',
  primaryMarkets: ['us'],
  confirmedObligationIds: required.filter((o) => o.id.startsWith('LEG-A11Y')).map((o) => o.id),
});
if (!t14.ok) errors.push('T14 partial');

if (errors.length) {
  console.error('G-2 golden full:\n' + errors.join('\n'));
  process.exit(1);
}

console.log(
  `✓ G-2 golden full — Pro ${completed.filter((m) => m.startsWith('M')).length} modules + Armor T11 ready + IronClad T12(${t12.obligationCount})`,
);
process.exit(0);
