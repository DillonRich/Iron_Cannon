#!/usr/bin/env node
process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';
import { invokeTool } from '../packages/mcp-core/src/index.js';

const errors = [];

const t12 = await invokeTool('T12', { tier: 'ironclad', primaryMarkets: ['us', 'eu'] });
if (!t12.ok || t12.obligationCount < 5 || !t12.legalDisclaimer) errors.push('T12 map');

const t13 = await invokeTool('T13', {
  tier: 'ironclad',
  obligationId: 'LEG-A11Y-001',
  snippet: '<img alt="logo" src="/logo.png" />',
});
if (!t13.ok || !t13.directive || !t13.evidenceRefs?.length) errors.push('T13 directive');
if (t13.verification?.compliant !== true) errors.push('T13 verify alt');

const t13bad = await invokeTool('T13', {
  tier: 'ironclad',
  obligationId: 'LEG-A11Y-001',
  snippet: '<img src="/x.png" />',
});
if (t13bad.verification?.compliant !== false) errors.push('T13 missing alt');

const t14 = await invokeTool('T14', {
  tier: 'ironclad',
  primaryMarkets: ['us'],
  confirmedObligationIds: [],
});
if (!t14.ok || t14.ready) errors.push('T14 should not be ready with zero confirmed');

const t12us = await invokeTool('T12', { tier: 'ironclad', primaryMarkets: ['us'] });
const t14ok = await invokeTool('T14', {
  tier: 'ironclad',
  primaryMarkets: ['us'],
  confirmedObligationIds: (t12us.obligations ?? [])
    .filter((o) => o.severity === 'required' || !o.severity)
    .map((o) => o.id),
});
if (!t14ok.ok || !t14ok.ready) errors.push('T14 full confirm');

if (errors.length) {
  console.error('G-2 ironclad smoke:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`✓ G-2 ironclad — T12(${t12.obligationCount}) T13 verify T14 gate`);
process.exit(0);
