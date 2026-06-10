#!/usr/bin/env node
/** G-35 exit — repo artifacts ready for operator deploy (no credentials required). */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const requiredDocs = [
  'docs/engine/OPERATOR_DEPLOY_READINESS.md',
  'docs/engine/MANUAL_SETUP_BLOCKERS.md',
  'docs/engine/CLOUDFLARE_ONBOARDING_CHECKLIST.md',
  'docs/engine/PRODUCTION_READINESS_SIGNOFF.md',
  'docs/engine/PLATFORM_D1_SETUP.md',
];

for (const rel of requiredDocs) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const artifacts = [
  'packages/mcp-core/src/generated/engine-bundle.json',
  'apps/mcp-worker/rules/bundle-manifest.json',
  'harvest-data/vectorize-manifest.json',
  'docs/engine/platform/d1/001_initial.sql',
  'docs/engine/openapi/iron-cannon-mcp.openapi.json',
  'apps/mcp-worker/wrangler.toml',
];

for (const rel of artifacts) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing artifact ${rel}`);
}

const wrangler = readFileSync(join(ROOT, 'apps/mcp-worker/wrangler.toml'), 'utf8');
if (!/main\s*=/.test(wrangler)) failures.push('wrangler.toml missing main');
if (!/nodejs_compat/.test(wrangler)) failures.push('wrangler.toml missing nodejs_compat');

const manifest = JSON.parse(readFileSync(join(ROOT, 'harvest-data/vectorize-manifest.json'), 'utf8'));
const vCount = manifest.vectorCount ?? manifest.vectors?.length ?? 0;
if (vCount < 10000) failures.push(`vectorize manifest count ${vCount} < 10000`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g35 = gr.gaps.find((g) => g.id === 'G-35');
if (!g35 || g35.status !== 'closed') failures.push('G-35 must be closed');
const g01 = gr.gaps.find((g) => g.id === 'G-01');
const g02 = gr.gaps.find((g) => g.id === 'G-02');
if (!g01 || g01.status !== 'deferred') failures.push('G-01 should remain deferred until live deploy');
if (!g02 || g02.status !== 'deferred') failures.push('G-02 should remain deferred until vectorize upsert');

const readiness = readFileSync(join(ROOT, 'docs/engine/OPERATOR_DEPLOY_READINESS.md'), 'utf8');
if (!readiness.includes('operator:readiness')) failures.push('readiness doc missing operator:readiness command');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Operator deploy readiness — docs + artifacts OK, vectorize ${vCount}, G-35 closed`);
process.exit(0);
