#!/usr/bin/env node
/**
 * Chunk 9 — L4 disclaimer + obligation map stubs.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OBLIGATION_INDEX = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const LEGAL_DISCLAIMER =
  'Iron Cannon provides technical comparison only, not legal advice. Consult qualified counsel.';

function tierAllows(tier, tool) {
  const iron = ['map_compliance_obligations', 'get_compliance_directives', 'audit_legal_readiness'];
  if (tier !== 'ironclad' && iron.includes(tool)) return false;
  return true;
}

function mapObligations(input) {
  if (!tierAllows(input.tier, 'map_compliance_obligations')) {
    return { code: 'TIER_INSUFFICIENT' };
  }
  const markets = input.primaryMarkets ?? ['us'];
  const rows = OBLIGATION_INDEX.obligations.filter(
    (o) => !o.markets || o.markets.some((m) => markets.includes(m)),
  );
  return {
    ok: true,
    obligations: rows,
    legalDisclaimer: LEGAL_DISCLAIMER,
    agentGuidance: { agentMustNot: ['claim legal_compliant'] },
  };
}

function auditLegal(input) {
  if (!tierAllows(input.tier, 'audit_legal_readiness')) {
    return { code: 'TIER_INSUFFICIENT' };
  }
  return {
    ok: true,
    ready: false,
    legalDisclaimer: LEGAL_DISCLAIMER,
    summary: 'Advisory compare only — gaps expected until counsel review',
  };
}

const tests = [
  () => {
    const r = mapObligations({ tier: 'ironclad', primaryMarkets: ['us'] });
    if (!r.obligations?.length) throw new Error('no obligations');
    if (!r.legalDisclaimer) throw new Error('missing disclaimer');
  },
  () => {
    const r = mapObligations({ tier: 'armor' });
    if (r.code !== 'TIER_INSUFFICIENT') throw new Error('armor should fail T12');
  },
  () => {
    const r = auditLegal({ tier: 'ironclad' });
    if (!r.legalDisclaimer.includes('not legal advice')) throw new Error('disclaimer text');
  },
];

const failures = [];
for (const t of tests) {
  try {
    t();
  } catch (e) {
    failures.push(e.message);
  }
}

const l4Fixtures = readdirSync(join(ROOT, 'docs/engine/specimens/fixtures/compliance')).filter((f) =>
  f.endsWith('.fixture-spec.json'),
);
if (l4Fixtures.length < 5) failures.push('expected >=5 L4 compliance fixtures');

if (failures.length) {
  console.error('Chunk 9 failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Chunk 9 Iron Clad — obligations + disclaimer + ${l4Fixtures.length} L4 fixtures`);
process.exit(0);
