#!/usr/bin/env node
import { assertToolAllowed } from '../packages/mcp-core/src/tier-gate.js';
import { filterComposedSlice } from '../packages/compose/src/index.js';

const proT12 = assertToolAllowed('pro', 'T12');
if (proT12.ok) {
  console.error('Expected pro blocked from T12');
  process.exit(1);
}
const ironT12 = assertToolAllowed('ironclad', 'T12');
if (!ironT12.ok) {
  console.error('Expected ironclad allowed T12');
  process.exit(1);
}
const slice = {
  ruleFragments: [{ layer: 'L4' }, { layer: 'L1' }],
  referenceCards: [{ refId: 'legal/gdpr' }, { refId: 'stripe/x' }],
  outbound: { legalCompliance: true },
};
const filtered = filterComposedSlice(slice, 'pro');
if (filtered.ruleFragments.some((f) => f.layer === 'L4')) {
  console.error('Pro tier should strip L4');
  process.exit(1);
}
console.log('✓ G-1 smoke — tier gate + compose redaction');
