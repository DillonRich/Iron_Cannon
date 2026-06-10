#!/usr/bin/env node
/** Stripe setup prep — repo artifacts + billing journeys without live keys. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const required = [
  'docs/engine/STRIPE_SETUP_PREP.md',
  'docs/engine/platform/d1/001_initial.sql',
  'apps/mcp-worker/src/platform-webhook.js',
  'apps/mcp-worker/src/index.js',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const sql = readFileSync(join(ROOT, 'docs/engine/platform/d1/001_initial.sql'), 'utf8');
if (!sql.includes('stripe_customer_id')) failures.push('D1 schema missing stripe_customer_id');
if (!sql.includes('stripe_subscription_id')) failures.push('D1 schema missing stripe_subscription_id');

const index = readFileSync(join(ROOT, 'apps/mcp-worker/src/index.js'), 'utf8');
if (!index.includes('/webhooks/stripe')) failures.push('worker index missing /webhooks/stripe route');

const prep = readFileSync(join(ROOT, 'docs/engine/STRIPE_SETUP_PREP.md'), 'utf8');
if (!prep.includes('transcript')) failures.push('STRIPE_SETUP_PREP missing transcript intake');

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
const journeys = uj.scenarios.filter((s) => s.id >= 'UJ-096' && s.id <= 'UJ-100');
if (journeys.length < 5) failures.push(`stripe prep journeys: ${journeys.length} < 5`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Stripe prep — D1 + webhook route OK, ${journeys.length} UJ-096–100`);
process.exit(0);
