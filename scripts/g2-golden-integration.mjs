#!/usr/bin/env node
/** Golden path through @ironcannon/mcp-core (T01→T03→T04→T05 sample) */
import { invokeTool } from '../packages/mcp-core/src/index.js';

const errors = [];

const t01 = await invokeTool('T01', { fixtureId: 'SD-01' });
if (!t01.ok || !t01.stack?.supported) errors.push('T01 SD-01 failed');

const t02 = await invokeTool('T02', { stack: t01.stack });
if (!t02.ok || !t02.complete) errors.push('T02 incomplete stack');

const t03 = await invokeTool('T03', { flowIds: ['auth-lifecycle', 'billing-subscription'] });
const ids = t03.wiremaps?.[0]?.moduleIds ?? [];
if (!t03.ok || ids.length !== 12) errors.push(`T03 expected 12 modules got ${ids.length}`);
if (t03.split) errors.push('T03 unexpected split');

const att = t03.wiremapAttestation;
const t04 = await invokeTool('T04', {
  moduleId: 'M12-stripe-webhook',
  tier: 'pro',
  wiremapAttestation: att,
});
if (!t04.ok || !t04.slice) errors.push('T04 M12 failed');
if (t04.slice?.ruleFragments?.some((f) => f.layer === 'L4')) errors.push('T04 pro should strip L4');
if (!t04.agentGuidance?.instruction) errors.push('T04 missing agentGuidance');

const t05 = await invokeTool('T05', { moduleId: 'M12-stripe-webhook', wiremapAttestation: att });
if (!t05.ok) errors.push('T05 M12 failed');

const t12deny = await invokeTool('T12', { tier: 'pro' });
if (t12deny.ok || t12deny.error !== 'TIER_INSUFFICIENT') errors.push('pro must be denied T12 (TIER_INSUFFICIENT)');

if (errors.length) {
  console.error('G-2 golden integration:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✓ G-2 golden integration — T01→T02→T03(12)→T04(M12)→T05(M12) via mcp-core');
process.exit(0);
