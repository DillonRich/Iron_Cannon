#!/usr/bin/env node
/** Merge imagination-50 + 50 integration/e2e/module scenarios → imagination-100-scenarios.json */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const base = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/imagination-50-scenarios.json'), 'utf8'),
);

const GOLDEN = [
  'M01-auth-d1-schema',
  'M02-auth-worker-routes',
  'M03-auth-resend-emails',
  'M04-auth-ui-routes',
  'M10-billing-d1-schema',
  'M11-stripe-checkout-route',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];

const extra = [
  { id: 'IMG-051', name: 'INT A01 context insufficient', harness: 'integration', row: 'A01' },
  { id: 'IMG-052', name: 'INT A05 throttle loop', harness: 'integration', row: 'A05' },
  { id: 'IMG-053', name: 'INT R07 stack drift', harness: 'integration', row: 'R07' },
  { id: 'IMG-054', name: 'INT R15 attestation required', harness: 'integration', row: 'R15' },
  { id: 'IMG-055', name: 'E2E golden path registry', harness: 'e2e' },
  { id: 'IMG-056', name: 'Outbound bundle 12 modules', harness: 'outbound' },
  { id: 'IMG-057', name: 'Rules package 27 modules', harness: 'rules-coverage' },
  { id: 'IMG-058', name: 'EM-1 74 flow steps', harness: 'extreme-map' },
  { id: 'IMG-059', name: 'Integration matrix registry', harness: 'integration-matrix' },
  { id: 'IMG-060', name: 'Compose precedence golden', harness: 'compose-precedence' },
  { id: 'IMG-061', name: 'Retrieval baseline 10 queries', harness: 'retrieval' },
  { id: 'IMG-062', name: 'Corpus scale-a 598', harness: 'corpus-scale' },
  { id: 'IMG-063', name: 'Corpus provider balance', harness: 'corpus-balance' },
  { id: 'IMG-064', name: 'Resume path R01-R15 harness', harness: 'resume-all' },
  { id: 'IMG-065', name: 'Scope S04 flow not in catalog', harness: 'integration', row: 'S04' },
  ...GOLDEN.map((module, i) => ({
    id: `IMG-${(66 + i).toString().padStart(3, '0')}`,
    name: `Golden outbound ${module}`,
    harness: 'outbound-module',
    module,
  })),
  { id: 'IMG-076', name: 'Optional M21 reset API', harness: 'chunk10b', module: 'M21-reset-api' },
  { id: 'IMG-077', name: 'Optional M22 reset UI', harness: 'chunk10b', module: 'M22-reset-ui' },
  { id: 'IMG-078', name: 'Optional M30 onboarding schema', harness: 'chunk10b', module: 'M30-onboarding-schema' },
  { id: 'IMG-079', name: 'Optional M41 deletion scheduler', harness: 'chunk10b', module: 'M41-deletion-scheduler' },
  { id: 'IMG-080', name: 'Optional M42 deletion UI', harness: 'chunk10b', module: 'M42-deletion-ui' },
  { id: 'IMG-081', name: 'Armor A02 session hardening', harness: 'chunk7', module: 'A02-session-hardening-pass' },
  { id: 'IMG-082', name: 'Armor A03 webhook hardening', harness: 'chunk7', module: 'A03-webhook-hardening-pass' },
  { id: 'IMG-083', name: 'L4 DT-08 header detect', harness: 'chunk12', fixture: 'DT-08' },
  { id: 'IMG-084', name: 'L4 DT-09 template scan', harness: 'chunk12', fixture: 'DT-09' },
  { id: 'IMG-085', name: 'L4 DT-10 config detect', harness: 'chunk12', fixture: 'DT-10' },
  { id: 'IMG-086', name: 'L4 DT-12 script before consent', harness: 'chunk12', fixture: 'DT-12' },
  { id: 'IMG-087', name: 'ERROR AUTH_MISSING', harness: 'errors', fixture: 'AUTH_MISSING' },
  { id: 'IMG-088', name: 'ERROR RATE_LIMIT', harness: 'errors', fixture: 'RATE_LIMIT_EXCEEDED' },
  { id: 'IMG-089', name: 'ERROR PAYLOAD_TOO_LARGE', harness: 'errors', fixture: 'PAYLOAD_TOO_LARGE' },
  { id: 'IMG-090', name: 'ERROR SLICE_TRUNCATED', harness: 'errors', fixture: 'SLICE_TRUNCATED' },
  { id: 'IMG-091', name: 'Pro recovery T07-01', harness: 'chunk5b', fixture: 'T07-01' },
  { id: 'IMG-092', name: 'Wiremap W03 compact', harness: 'chunk5a', fixture: 'W03' },
  { id: 'IMG-093', name: 'Scale profiles T12-T14', harness: 'scale-profiles' },
  { id: 'IMG-094', name: 'Obligation LEG-PRIV-001 fixture', harness: 'obligation', obligationId: 'LEG-PRIV-001' },
  { id: 'IMG-095', name: 'Obligation LEG-EMAIL-001 fixture', harness: 'obligation', obligationId: 'LEG-EMAIL-001' },
  { id: 'IMG-096', name: 'Remote handler map doc', harness: 'doc', path: 'docs/engine/PLANNING_PHASE1_CHUNK23_REMOTE_HANDLERS.md' },
  { id: 'IMG-097', name: 'EM-2 security matrix doc', harness: 'doc', path: 'docs/engine/PLANNING_PHASE1_CHUNK21_EM2_MODULE_SECURITY.md' },
  { id: 'IMG-098', name: 'MCP E2E criteria doc', harness: 'doc', path: 'docs/engine/PLANNING_MCP_E2E_SUCCESS_CRITERIA.md' },
  { id: 'IMG-099', name: 'Planning master SSOT', harness: 'doc', path: 'docs/engine/PLANNING_MASTER.md' },
  { id: 'IMG-100', name: 'MASTER_PLAN trace matrix', harness: 'doc', path: 'docs/engine/PLANNING_MASTER_PLAN_TRACE.md' },
];

const out = {
  version: '1.0.0',
  minSuccessRate: 0.95,
  minScenarioPassRateBaseline: 1.0,
  minScenarioPassRateExtended: 0.9,
  baselineCount: 50,
  scenarios: [...base.scenarios, ...extra],
};

writeFileSync(
  join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json'),
  JSON.stringify(out, null, 2) + '\n',
);
console.log(`✓ imagination-100 — ${out.scenarios.length} scenarios`);
