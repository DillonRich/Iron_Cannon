#!/usr/bin/env node
import { readEngineJson } from '../packages/mcp-core/src/engine-data.js';
import { verifyObligationSnippet, detectTypeCoverage } from '../packages/mcp-core/src/obligation-verify.js';
import { verifyObligationCompliance } from '../packages/mcp-core/src/obligation-compare.js';
import { invokeTool } from '../packages/mcp-core/src/index.js';

const errors = [];
const idx = readEngineJson('specimens/obligation-index.specimen.json');

const cases = [
  {
    id: 'LEG-A11Y-001',
    snippet: '<img alt="x" src="/a.png" />',
    want: true,
  },
  {
    id: 'LEG-A11Y-002',
    snippet: '<label htmlFor="email">Email</label><input id="email" />',
    want: true,
  },
  {
    id: 'LEG-GLOBAL-001',
    snippet: 'export default function Page() { return <Link href="/privacy">Privacy</Link> }',
    want: true,
  },
  {
    id: 'LEG-RECORD-001',
    snippet: 'CREATE TABLE consent_audit_log (id TEXT PRIMARY KEY)',
    want: true,
  },
  {
    id: 'LEG-A11Y-005',
    snippet: '<a href="#main" className="skip-nav">skip to content</a>',
    want: true,
  },
  {
    id: 'LEG-GLOBAL-001',
    snippet: '<a href="/legal#privacy-policy">Privacy Policy</a>',
    want: true,
  },
  {
    id: 'LEG-TERMS-003',
    snippet: '<form action="register.html"><a href="/legal#terms-of-service">Terms</a></form>',
    want: true,
  },
  {
    id: 'LEG-TERMS-001',
    snippet: 'CREATE TABLE subscriptions (terms_accepted_at INTEGER);',
    want: true,
  },
  {
    id: 'LEG-PRIV-004',
    snippet: "router.post('/api/account/delete-account', handler);",
    want: true,
  },
];

for (const c of cases) {
  const row = idx.obligations.find((o) => o.id === c.id);
  const v = verifyObligationSnippet(row, c.snippet);
  if (v.compliant !== c.want) errors.push(`${c.id} compliant=${v.compliant}`);
}

const manual = idx.obligations.find((o) => o.id === 'LEG-A11Y-006');
if (verifyObligationSnippet(manual, '<div />').reason !== 'manual_review') {
  errors.push('manual type');
}

const cov = detectTypeCoverage(idx.obligations);
const unsupported = Object.entries(cov).filter(([t, s]) => t !== 'none' && s.auto < s.total);
if (unsupported.length) {
  const bad = unsupported.filter(([t]) => t !== 'manual');
  if (bad.length) errors.push(`unsupported types: ${bad.map(([t]) => t).join(', ')}`);
}

const cmp = verifyObligationCompliance(
  idx.obligations.find((o) => o.id === 'LEG-GLOBAL-001'),
  'app/privacy/page.tsx href="/privacy"',
);
if (cmp.method !== 'layer4-compare' || cmp.compliant !== true) errors.push('layer4 compare LEG-GLOBAL-001');

const t13 = await invokeTool('T13', {
  tier: 'ironclad',
  obligationId: 'LEG-GLOBAL-002',
  snippet: 'app/terms/page.tsx — public /terms route',
});
if (!t13.ok || t13.verification?.compliant !== true) errors.push('T13 LEG-GLOBAL-002');
if (t13.verification?.method !== 'layer4-compare') errors.push('T13 compare method');

if (errors.length) {
  console.error('G-2 obligation verify:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(
  `✓ G-2 obligation verify — ${cases.length} detect types + ${Object.keys(cov).length} type buckets`,
);
process.exit(0);
