#!/usr/bin/env node
/**
 * Chunk 7 — validates golden M01–M16 each have specimen + verify fixture + manifest entry.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/phase1/rules-manifest.json'), 'utf8'),
);
const MATRIX = {
  'M01-auth-d1-schema': 'M01-auth-d1-schema.fixture-spec.json',
  'M02-auth-worker-routes': 'M02-auth-worker-routes.fixture-spec.json',
  'M03-auth-resend-emails': 'M03-auth-resend-emails.fixture-spec.json',
  'M04-auth-ui-routes': 'M04-auth-ui-routes.fixture-spec.json',
  'M05-auth-session-middleware': 'M05-auth-session-middleware.fixture-spec.json',
  'M10-billing-d1-schema': 'M10-billing-d1-schema.fixture-spec.json',
  'M11-stripe-checkout-route': 'M11-stripe-checkout-route.fixture-spec.json',
  'M12-stripe-webhook': 'M12-stripe-webhook.fixture-spec.json',
  'M13-provisioning-kv': 'M13-provisioning-kv.fixture-spec.json',
  'M14-billing-success-ui': 'M14-billing-success-ui.fixture-spec.json',
  'M15-billing-dashboard-ui': 'M15-billing-dashboard-ui.fixture-spec.json',
  'M16-billing-emails': 'M16-billing-emails.fixture-spec.json',
};

const FIXTURES = join(ROOT, 'docs/engine/specimens/fixtures/modules');
const SPECIMENS = join(ROOT, 'docs/engine/specimens');
const errors = [];

for (const [moduleId, fixtureFile] of Object.entries(MATRIX)) {
  if (!MANIFEST.modules[moduleId]) errors.push(`${moduleId}: missing manifest`);
  const entry = MANIFEST.modules[moduleId];
  const specPath = join(SPECIMENS, '..', entry?.specimenPath ?? '');
  const specAlt = join(ROOT, 'docs/engine', entry?.specimenPath ?? '');
  if (entry && !existsSync(specAlt)) errors.push(`${moduleId}: specimen ${entry.specimenPath}`);
  const fixPath = join(FIXTURES, fixtureFile);
  if (!existsSync(fixPath)) errors.push(`${moduleId}: fixture ${fixtureFile}`);
  else {
    const fix = JSON.parse(readFileSync(fixPath, 'utf8'));
    if (!fix.passSnippet) errors.push(`${moduleId}: fixture missing passSnippet`);
    if (!fix.failSnippet) errors.push(`${moduleId}: fixture missing failSnippet`);
    if (fix.expectedPass !== true) errors.push(`${moduleId}: expectedPass must be true`);
  }
}

if (errors.length) {
  console.error('Chunk 7 golden loop failures:\n' + errors.join('\n'));
  process.exit(1);
}

console.log(`✓ Chunk 7 golden loop — ${Object.keys(MATRIX).length} modules ready for T04/T05 expansion`);
process.exit(0);
