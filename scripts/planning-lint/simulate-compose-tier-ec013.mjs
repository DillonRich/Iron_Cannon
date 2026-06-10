#!/usr/bin/env node
/** EC-013 — Pro T04 must not receive legalCompliance / L4 / legal/* cards */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { filterComposedSlice } from './lib/filter-composed-slice.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TIER = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/tier-entitlement-matrix.json'), 'utf8'),
);
const EDGE = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/edge-case-registry.json'), 'utf8'),
);

const ec = EDGE.edgeCases.find((e) => e.id === 'EC-013');
const slice = {
  ruleFragments: [
    { layer: 'L2', id: 'stripe/checkout' },
    { layer: 'L4', id: 'legal/privacy-001' },
    { layer: 'L3', id: 'owasp/csrf' },
  ],
  mapNodes: [{ type: 'legal_touchpoint', id: 'tp1' }, { type: 'module', id: 'M04' }],
  referenceCards: [
    { refId: 'stripe/api-checkout' },
    { refId: 'legal/gdpr-erasure' },
    { refId: 'cloudflare/workers' },
  ],
  outbound: {
    moduleId: 'M04-auth-ui-routes',
    legalCompliance: { obligations: ['LEG-PRIV-001'] },
    obligations: ['LEG-PRIV-001'],
    marketBundle: 'eu',
    directives: ['Add privacy link'],
  },
};

const failures = [];
for (const tier of ['pro', 'armor', 'ironclad']) {
  const filtered = filterComposedSlice(slice, tier);
  const ent = TIER.composeEntitlements[tier];
  const hasLegalCard = (filtered.referenceCards ?? []).some((c) =>
    (ent.forbiddenRefIdPrefixes ?? []).some((p) => c.refId?.startsWith(p)),
  );
  const hasL4 = (filtered.ruleFragments ?? []).some((f) => f.layer === 'L4');
  const hasLegalTp = (filtered.mapNodes ?? []).some((n) => n.type === 'legal_touchpoint');
  const strippedOutbound =
    !filtered.outbound?.legalCompliance &&
    !filtered.outbound?.obligations &&
    !filtered.outbound?.marketBundle;

  if (tier === 'pro') {
    if (hasLegalCard) failures.push('pro: legal ref card leaked');
    if (hasL4) failures.push('pro: L4 fragment leaked');
    if (hasLegalTp) failures.push('pro: legal_touchpoint map node leaked');
    if (!strippedOutbound) failures.push('pro: outbound legal keys not stripped');
  }
  if (tier === 'armor') {
    if (hasL4) failures.push('armor: L4 leaked');
    if (hasLegalCard) failures.push('armor: legal card leaked');
  }
  if (tier === 'ironclad') {
    if (!hasL4) failures.push('ironclad: L4 should remain');
  }
}

if (!ec) failures.push('EC-013 missing from registry');

if (failures.length) {
  console.error('EC-013 compose tier failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('✓ EC-013 compose tier — Pro/Armor redaction, IronClad retains L4');
process.exit(0);
