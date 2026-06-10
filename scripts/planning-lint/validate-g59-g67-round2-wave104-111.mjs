#!/usr/bin/env node
/** Round 2 remediation waves 104–111 (G-59–G-67). */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { invokeTool } from '../../packages/mcp-core/src/index.js';
import { composeModuleDirective } from '../../packages/mcp-core/src/t04-compose.js';
import { verifyObligationCompliance } from '../../packages/mcp-core/src/obligation-compare.js';
import { readEngineJson } from '../../packages/mcp-core/src/engine-data.js';
import {
  resetSessionStoreForTests,
  getWiremapAttestation,
} from '../../packages/mcp-core/src/session-attestation.js';
import { loadModuleFixture } from '../../packages/mcp-core/src/load-fixture.js';
import { verifyModuleCompliance } from '../../packages/mcp-core/src/t05-verify.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

for (const rel of [
  'docs/engine/GUARDIAN_ROUND2_REMEDIATION_PLAN.md',
  'docs/engine/planning/snippet-hint-registry.json',
  'scripts/ironcannon-dogfood.mjs',
  'packages/mcp-core/src/snippet-hints.js',
]) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const t04 = composeModuleDirective('M12-stripe-webhook', 'pro');
if (!t04.snippetHint?.symbols?.includes('handleStripeWebhook')) {
  failures.push('T04 M12 missing snippetHint');
}

process.env.IRON_CANNON_SKIP_WIREMAP_GATE = '1';
const t11ack = await invokeTool('T11', {
  tier: 'armor',
  wiremapContext: { completedModules: ['M01-auth-d1-schema', 'M05-auth-session-middleware', 'M12-stripe-webhook'] },
  autoConfirmInfra: true,
});
if (!t11ack.infraAcknowledged) failures.push('T11 autoConfirmInfra should set infraAcknowledged');
if (t11ack.infraReady || t11ack.infraVerified) {
  failures.push('T11 autoConfirmInfra alone must not set infraReady/infraVerified');
}

const obligations = readEngineJson('specimens/obligation-index.specimen.json');
const privacy = obligations.obligations.find((o) => o.id === 'LEG-GLOBAL-001');
const vPass = verifyObligationCompliance(privacy, '<a href="/legal#privacy-policy">Privacy</a>');
if (vPass.status !== 'pass') failures.push(`T13 LEG-GLOBAL-001 expected pass got ${vPass.status}`);

const vInc = verifyObligationCompliance(privacy, '');
if (vInc.status !== 'inconclusive' || !vInc.requiredInputs?.includes('snippet')) {
  failures.push('T13 empty snippet should be inconclusive with requiredInputs');
}

const t02 = await invokeTool('T02', {
  tier: 'pro',
  stack: { supported: true, missingConfig: ['STRIPE_WEBHOOK_SECRET'], conflicts: [], warnings: [] },
});
if (!t02.completenessHints?.some((h) => h.key === 'STRIPE_WEBHOOK_SECRET')) {
  failures.push('T02 missing STRIPE_WEBHOOK_SECRET completenessHints');
}

resetSessionStoreForTests();
const client = 'g59-t05-verify-wire';
const t03 = await invokeTool('T03', { tier: 'pro', clientKey: client });
const att = t03.wiremapAttestation;
const spec = loadModuleFixture('M01-auth-d1-schema');
const snippet = spec?.passSnippet ?? 'CREATE TABLE users (id TEXT PRIMARY KEY);';
await invokeTool('T05', {
  tier: 'pro',
  clientKey: client,
  moduleId: 'M01-auth-d1-schema',
  wiremapAttestation: att,
  snippet,
});
const stored = getWiremapAttestation(client);
if (!stored?.verifiedModules?.includes('M01-auth-d1-schema')) {
  failures.push('T05 pass should append verifiedModules to attestation');
}

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
for (const id of ['G-58', 'G-59', 'G-60', 'G-61', 'G-62', 'G-63', 'G-64', 'G-65']) {
  const row = gr.gaps.find((g) => g.id === id);
  if (!row || row.status !== 'closed') failures.push(`${id} must be closed in gap-register`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('✓ G-59–G-67 round 2 waves 104–111 — snippetHint, infra honesty, T13 tri-state, dogfood, T05→verifiedModules');
process.exit(0);
