#!/usr/bin/env node
import { invokeTool } from '../packages/mcp-core/src/index.js';

const errors = [];

const t09pro = await invokeTool('T09', { tier: 'pro', surfaceHints: [{ type: 'webhook' }] });
if (t09pro.ok) errors.push('pro denied T09');

const t09 = await invokeTool('T09', { tier: 'armor', surfaceHints: [{ type: 'webhook' }] });
if (!t09.ok || !(t09.surfaces?.length > 0)) errors.push('armor T09 surfaces');
if (!(t09.infrastructure?.length >= 6)) errors.push('armor T09 infrastructure domains');

const t12 = await invokeTool('T12', { tier: 'ironclad', primaryMarkets: ['us'] });
if (!t12.ok || !t12.obligations?.length || !t12.legalDisclaimer) errors.push('ironclad T12');

const t12armor = await invokeTool('T12', { tier: 'armor' });
if (t12armor.ok) errors.push('armor denied T12');

if (errors.length) {
  console.error('G-2 armor smoke:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✓ G-2 armor smoke — tier gates + T09/T12 handlers');
process.exit(0);
