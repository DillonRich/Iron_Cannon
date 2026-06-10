#!/usr/bin/env node
/** Add AUTH-P49-* and BILL-P49-* to golden + billing module fixtures */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MOD = join(ROOT, 'docs/engine/specimens/fixtures/modules');

const AUTH_MODULES = [
  'M01-auth-d1-schema', 'M02-auth-worker-routes', 'M03-auth-resend-emails', 'M04-auth-ui-routes',
  'M05-auth-session-middleware', 'M20-reset-token-schema', 'M21-reset-api', 'M22-reset-ui',
];
const BILL_MODULES = [
  'M10-billing-d1-schema', 'M11-stripe-checkout-route', 'M12-stripe-webhook',
  'M13-provisioning-kv', 'M14-billing-success-ui', 'M15-billing-dashboard-ui', 'M16-billing-emails',
];

let updated = 0;
for (const f of readdirSync(MOD).filter((x) => x.endsWith('.fixture-spec.json'))) {
  const path = join(MOD, f);
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  const mid = spec.moduleId ?? f.replace('.fixture-spec.json', '');
  const patterns = new Set(spec.patternsUnderTest ?? []);
  const before = patterns.size;
  if (AUTH_MODULES.includes(mid)) {
    patterns.add(`AUTH-P49-${mid.slice(0, 4)}`);
    patterns.add(`AUTH-P49-SESSION`);
  }
  if (BILL_MODULES.includes(mid)) {
    patterns.add(`BILL-P49-${mid.slice(0, 4)}`);
    patterns.add(`STWH-P49-VERIFY`);
  }
  if (patterns.size > before) {
    spec.patternsUnderTest = [...patterns];
    writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
    updated += 1;
  }
}
console.log(`✓ Compliance patterns wave 49 — ${updated} module fixtures updated`);
