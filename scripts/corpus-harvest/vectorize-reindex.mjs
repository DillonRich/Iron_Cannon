#!/usr/bin/env node
/**
 * Vectorize reindex — requires Cloudflare credentials (NOT runnable without setup).
 * Planning stub + manifest export for Workers AI embedding batch.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX = join(ROOT, 'docs/engine/specimens/reference-index.specimen.json');
const OUT = join(ROOT, 'harvest-data/vectorize-manifest.json');

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const indexName = process.env.VECTORIZE_INDEX_NAME ?? 'iron-cannon-corpus';

if (!token || !accountId) {
  console.log(`
Vectorize reindex — setup required

  1. Cloudflare dashboard → Workers & Pages → Vectorize → Create index "${indexName}"
  2. Workers AI enabled on account
  3. Set environment variables:

     CLOUDFLARE_API_TOKEN=<API token with Workers AI + Vectorize Edit>
     CLOUDFLARE_ACCOUNT_ID=<account id>
     VECTORIZE_INDEX_NAME=${indexName}

  4. After core MCP Worker exists, copy embed job from:
     docs/engine/PLANNING_PHASE1_CHUNK14_SCALE_ENGINE.md
     docs/engine/VECTORIZE_RAG_SPEC.md

  This script exported a manifest only (no API calls without credentials).
`);
}

const { entries } = JSON.parse(readFileSync(INDEX, 'utf8'));
const manifest = {
  rulesetVersion: '2026.05.31',
  indexName,
  accountId: accountId ?? '(unset)',
  vectorCount: entries.length,
  vectors: entries.map((e) => ({
    id: e.refId,
    metadata: {
      refId: e.refId,
      provider: e.provider,
      source: 'references',
      rulesetVersion: '2026.05.31',
    },
    textForEmbedding: `${e.title}. ${e.embeddingHint}`,
  })),
};

mkdirSync(join(ROOT, 'harvest-data'), { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`✓ Vectorize manifest — ${manifest.vectorCount} vectors → ${OUT}`);

if (token && accountId) {
  console.log('Credentials present — implement Phase 2: @cf/baai/bge-base-en-v1.5 batch upsert via Workers script.');
  console.log('Harvest pipeline does not embed inline; run from apps/mcp-worker admin route after impl authorization.');
}

process.exit(0);
