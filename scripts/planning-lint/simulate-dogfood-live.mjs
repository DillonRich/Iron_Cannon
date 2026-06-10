#!/usr/bin/env node
/**
 * Pre-CF dogfood exhaust — monorepo discovery + golden T04/T05 chain + worker-focus modules.
 * No Cloudflare account required (in-process invokeTool).
 */
import { invokeTool } from './lib/mcp-invoke.mjs';
import { resetRateLimitForTests } from '../../packages/mcp-core/src/rate-limit.js';
import {
  REPO_ROOT,
  MCP_WORKER_DIR,
  MCP_CORE_DIR,
} from './lib/iron-cannon-repo.mjs';
import { REFERENCE_APP_DIR } from './lib/golden-reference-app-modules.mjs';

const GOLDEN_MODULES = [
  'M01-auth-d1-schema',
  'M02-auth-worker-routes',
  'M03-auth-resend-emails',
  'M04-auth-ui-routes',
  'M05-auth-session-middleware',
  'M10-billing-d1-schema',
  'M11-stripe-checkout-route',
  'M12-stripe-webhook',
  'M13-provisioning-kv',
  'M14-billing-success-ui',
  'M15-billing-dashboard-ui',
  'M16-billing-emails',
];

/** Maps to apps/mcp-worker + platform billing surface. */
const WORKER_FOCUS = ['M02-auth-worker-routes', 'M12-stripe-webhook'];

const failures = [];
const notes = [];

function check(label, cond, detail = '') {
  if (!cond) failures.push(detail ? `${label}: ${detail}` : label);
}

async function probeHttp() {
  if (process.env.IRON_CANNON_SKIP_HTTP === '1') return;
  try {
    const res = await fetch('http://127.0.0.1:8787/health', { signal: AbortSignal.timeout(2000) });
    const body = await res.json();
    check('local HTTP /health', res.ok && body?.ok === true, JSON.stringify(body));
    if (res.ok) notes.push('local worker :8787 reachable (optional)');
  } catch {
    notes.push('local worker :8787 not running (optional — use npm run ironcannon:serve)');
  }
}

// --- Phase 1: monorepo stack discovery ---
const rootT01 = await invokeTool('T01', { projectPath: REPO_ROOT, tier: 'pro' });
check('T01 repo root', rootT01.ok);
check('T01 repo supported:false', rootT01.stack?.supported === false);

const rootT02 = await invokeTool('T02', { stack: rootT01.stack, tier: 'pro' });
check('T02 repo root', rootT02.ok);
check('T02 repo incomplete', rootT02.complete === false);

const workerT01 = await invokeTool('T01', { projectPath: MCP_WORKER_DIR, tier: 'pro' });
check('T01 mcp-worker', workerT01.ok);
check('T01 worker compute', workerT01.stack?.compute === 'cloudflare_workers');

const coreT01 = await invokeTool('T01', { projectPath: MCP_CORE_DIR, tier: 'pro' });
check('T01 mcp-core', coreT01.ok);

const refT01 = await invokeTool('T01', { projectPath: REFERENCE_APP_DIR, tier: 'pro' });
check('T01 reference app supported', refT01.stack?.supported === true);

// --- Phase 2: sequence guard ---
resetRateLimitForTests();
const t03 = await invokeTool('T03', { tier: 'pro', clientKey: 'dogfood-wiremap' });
check('T03 wiremap', t03.ok && (t03.wiremaps?.[0]?.moduleIds?.length ?? 0) >= 12);
const att = t03.wiremapAttestation;

const skipSeq = await invokeTool('T04', {
  moduleId: 'M02-auth-worker-routes',
  tier: 'pro',
  completedModules: [],
  wiremapAttestation: att,
});
check('T04 sequence guard', skipSeq.error === 'MODULE_SEQUENCE_VIOLATION');

// --- Phase 3: full golden T04/T05 ---
resetRateLimitForTests();
const completed = [];
for (const moduleId of GOLDEN_MODULES) {
  const t04 = await invokeTool('T04', {
    moduleId,
    tier: 'pro',
    clientKey: 'dogfood-golden',
    completedModules: [...completed],
    wiremapAttestation: att,
  });
  if (!t04.ok) {
    failures.push(`T04 ${moduleId}: ${t04.error ?? t04.message ?? 'failed'}`);
    break;
  }
  const t05 = await invokeTool('T05', {
    moduleId,
    tier: 'pro',
    clientKey: 'dogfood-golden',
    wiremapAttestation: att,
  });
  if (!t05.compliant) {
    failures.push(`T05 ${moduleId}: not compliant`);
    break;
  }
  completed.push(moduleId);
}
check('golden 12-module chain', completed.length === GOLDEN_MODULES.length, `got ${completed.length}`);

// --- Phase 4: worker-focus modules (explicit) ---
resetRateLimitForTests();
for (const moduleId of WORKER_FOCUS) {
  const idx = GOLDEN_MODULES.indexOf(moduleId);
  const prior = GOLDEN_MODULES.slice(0, idx);
  const t04 = await invokeTool('T04', {
    moduleId,
    tier: 'pro',
    clientKey: 'dogfood-worker',
    completedModules: prior,
    wiremapAttestation: att,
  });
  check(`T04 ${moduleId}`, t04.ok, t04.error);
  const t05 = await invokeTool('T05', {
    moduleId,
    tier: 'pro',
    clientKey: 'dogfood-worker',
    wiremapAttestation: att,
  });
  check(`T05 ${moduleId} compliant`, t05.compliant === true);
}

// --- Phase 5: tier gate ---
resetRateLimitForTests();
const t09pro = await invokeTool('T09', { tier: 'pro', clientKey: 'dogfood-tier' });
check('T09 pro blocked', t09pro.error === 'TIER_INSUFFICIENT');
const t09armor = await invokeTool('T09', { tier: 'armor', clientKey: 'dogfood-tier' });
check('T09 armor allowed', t09armor.ok === true);

await probeHttp();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ Dogfood live — monorepo baselines + ${completed.length}-module golden + worker focus (${WORKER_FOCUS.join(', ')})`,
);
if (notes.length) console.log(`  notes: ${notes.join('; ')}`);
process.exit(0);
