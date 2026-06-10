#!/usr/bin/env node
/**
 * Module fixture linter — every planned module must have pass/fail fixture spec.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/modules');

const REQUIRED_MODULES = [
  'M01-auth-d1-schema', 'M02-auth-worker-routes', 'M03-auth-resend-emails',
  'M04-auth-ui-routes', 'M05-auth-session-middleware',
  'M10-billing-d1-schema', 'M11-stripe-checkout-route', 'M12-stripe-webhook',
  'M13-provisioning-kv', 'M14-billing-success-ui', 'M15-billing-dashboard-ui',
  'M16-billing-emails',
  'A01-security-surface-map', 'A02-session-hardening-pass', 'A03-webhook-hardening-pass',
  'M20-reset-token-schema', 'M21-reset-api', 'M22-reset-ui', 'M23-reset-email',
  'M30-onboarding-schema', 'M31-onboarding-api', 'M32-onboarding-ui',
  'M40-deletion-api', 'M41-deletion-scheduler', 'M42-deletion-ui',
  'M50-export-api', 'M51-export-worker', 'M52-export-ui',
  'M55-terms-reaccept-api', 'M56-terms-reaccept-ui',
];

const errors = [];

function main() {
  const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'));
  const byModule = new Map();

  for (const file of files) {
    const path = join(FIXTURE_DIR, file);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (!data.moduleId) errors.push(`${file}: missing moduleId`);
    if (!data.passSnippet || !data.failSnippet) errors.push(`${file}: missing pass/fail snippet`);
    if (data.expectedPass !== true) errors.push(`${file}: expectedPass must be true`);
    if (!Array.isArray(data.patternsUnderTest) || data.patternsUnderTest.length < 1) {
      errors.push(`${file}: patternsUnderTest required`);
    }
    byModule.set(data.moduleId, file);
  }

  for (const mod of REQUIRED_MODULES) {
    if (!byModule.has(mod)) errors.push(`Missing fixture spec for ${mod}`);
  }

  console.log('Iron Cannon module fixtures lint\n');
  console.log(`Fixture specs: ${files.length} / ${REQUIRED_MODULES.length}`);
  console.log('');

  if (errors.length) {
    console.log('ERRORS:');
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log('✓ All module fixtures present with pass/fail snippets');
  process.exit(0);
}

main();
