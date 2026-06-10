#!/usr/bin/env node
/**
 * Vectorize upsert — requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID.
 * Embeds via Workers AI (@cf/baai/bge-base-en-v1.5) in batches; upserts to Vectorize v2 API.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = join(ROOT, 'harvest-data/vectorize-manifest.json');
const MODEL = '@cf/baai/bge-base-en-v1.5';
const BATCH = Number(process.env.VECTORIZE_UPSERT_BATCH ?? 8);
const LIMIT = Number(process.env.VECTORIZE_UPSERT_LIMIT ?? 0);

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const indexName = process.env.VECTORIZE_INDEX_NAME ?? 'iron-cannon-corpus';

if (!existsSync(MANIFEST)) {
  console.error('Run npm run harvest:vectorize-manifest first');
  process.exit(1);
}

if (!token || !accountId) {
  console.log('⊘ vectorize-upsert skipped — set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID');
  console.log('  See docs/engine/CLOUDFLARE_ONBOARDING_CHECKLIST.md');
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let vectors = manifest.vectors ?? [];
if (LIMIT > 0) vectors = vectors.slice(0, LIMIT);

async function embedTexts(texts) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: texts }),
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.errors?.[0]?.message ?? `embed HTTP ${res.status}`);
  }
  const data = json.result?.data ?? json.result;
  if (Array.isArray(data?.[0])) return data;
  if (Array.isArray(data) && typeof data[0]?.length === 'number') return data;
  throw new Error('unexpected embed response shape');
}

async function upsertBatch(batchVectors) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}/upsert`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vectors: batchVectors }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.errors?.[0]?.message ?? `upsert HTTP ${res.status}`);
  }
  return json;
}

let done = 0;
for (let i = 0; i < vectors.length; i += BATCH) {
  const slice = vectors.slice(i, i + BATCH);
  const texts = slice.map((v) => v.textForEmbedding);
  const embeddings = await embedTexts(texts);
  const batchVectors = slice.map((v, j) => ({
    id: v.id,
    values: embeddings[j],
    metadata: v.metadata ?? { refId: v.id },
  }));
  await upsertBatch(batchVectors);
  done += slice.length;
  console.log(`  upserted ${done}/${vectors.length}`);
}

console.log(`✓ vectorize-upsert — ${done} vectors → index ${indexName}`);
process.exit(0);
