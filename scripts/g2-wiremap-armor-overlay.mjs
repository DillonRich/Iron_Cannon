#!/usr/bin/env node
/** Armor overlay modules (A*) may verify outside pro wiremap module list. */
import { invokeTool } from '../packages/mcp-core/src/index.js';

const t03 = await invokeTool('T03', { tier: 'pro' });
const att = t03.wiremapAttestation;

const a02 = await invokeTool('T05', {
  moduleId: 'A02-session-hardening-pass',
  tier: 'armor',
  wiremapAttestation: att,
});
if (!a02.ok || !a02.compliant) {
  console.error('A02 overlay T05', a02);
  process.exit(1);
}

const mismatch = await invokeTool('T05', {
  moduleId: 'M99-fake-module',
  tier: 'pro',
  wiremapAttestation: att,
});
if (mismatch.error !== 'WIREMAP_MODULE_MISMATCH') {
  console.error('expected WIREMAP_MODULE_MISMATCH', mismatch);
  process.exit(1);
}

console.log('✓ g2-wiremap-armor-overlay — A* modules allowed with attestation');
process.exit(0);
