#!/usr/bin/env node
/**
 * Preflight for G-02 Vectorize — manifest sanity + credential hints (no API calls required).
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = join(ROOT, 'harvest-data/vectorize-manifest.json');

if (!existsSync(MANIFEST)) {
  console.error('Missing manifest — run: npm run harvest:vectorize-manifest');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const count = manifest.vectorCount ?? manifest.vectors?.length ?? 0;
if (count < 1000) {
  console.error(`vectorCount suspiciously low: ${count}`);
  process.exit(1);
}

const sample = manifest.vectors?.[0];
if (!sample?.id || !sample?.textForEmbedding) {
  console.error('manifest vectors missing id or textForEmbedding');
  process.exit(1);
}

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const indexName = process.env.VECTORIZE_INDEX_NAME ?? manifest.indexName ?? 'iron-cannon-corpus';

console.log(`✓ Vectorize preflight — ${count} vectors in manifest (index: ${indexName})`);

if (!token || !accountId) {
  console.log(`
Credentials not set (export-only mode OK for local dev).

  CLOUDFLARE_API_TOKEN=...
  CLOUDFLARE_ACCOUNT_ID=...
  VECTORIZE_INDEX_NAME=${indexName}

Then: npm run harvest:vectorize-upsert
See: docs/engine/CLOUDFLARE_ONBOARDING_CHECKLIST.md § Phase 4
`);
  process.exit(0);
}

console.log('Credentials present — run: npm run harvest:vectorize-upsert');
process.exit(0);
