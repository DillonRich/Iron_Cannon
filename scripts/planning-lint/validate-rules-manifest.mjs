#!/usr/bin/env node
/**
 * Validates rules-manifest.json module entries resolve to specimen files.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = join(ROOT, 'docs/engine/phase1/rules-manifest.json');
const SPECIMENS = join(ROOT, 'docs/engine/specimens');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const errors = [];

if (!manifest.rulesetVersion) errors.push('missing rulesetVersion');
if (!manifest.modules || typeof manifest.modules !== 'object') errors.push('missing modules');

const GOLDEN = [
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

for (const moduleId of GOLDEN) {
  if (!manifest.modules[moduleId]) {
    errors.push(`golden module missing from manifest: ${moduleId}`);
    continue;
  }
  const entry = manifest.modules[moduleId];
  if (!entry.specimenPath) {
    errors.push(`${moduleId}: missing specimenPath`);
    continue;
  }
  const full = join(SPECIMENS, '..', entry.specimenPath.startsWith('specimens/') ? entry.specimenPath : `specimens/${entry.specimenPath}`);
  const alt = join(ROOT, 'docs/engine', entry.specimenPath);
  if (!existsSync(alt) && !existsSync(full)) errors.push(`${moduleId}: specimen not found ${entry.specimenPath}`);
}

for (const [moduleId, entry] of Object.entries(manifest.modules ?? {})) {
  if (!entry.fragmentIds?.length) errors.push(`${moduleId}: no fragmentIds`);
}

if (errors.length) {
  console.error('Rules manifest validation failures:\n' + errors.join('\n'));
  process.exit(1);
}

console.log(`✓ rules-manifest — ${Object.keys(manifest.modules).length} modules indexed`);
process.exit(0);
