#!/usr/bin/env node
/** Vectorize adapter: live binding mock + local fallback */
import {
  mapVectorizeMatches,
  queryVectorizeBinding,
  retrieveRefsAsync,
} from '../packages/mcp-core/src/retrieval.js';

const mockBinding = {
  async query({ topK }) {
    return {
      matches: [
        { id: 'stripe/webhook-signature-verify', score: 0.92, metadata: { provider: 'stripe', hint: 'webhook' } },
        { id: 'cloudflare/worker-raw-body', score: 0.81, metadata: { provider: 'cloudflare' } },
      ].slice(0, topK),
    };
  },
};

const mapped = mapVectorizeMatches(
  [{ id: 'stripe/x', score: 0.5, metadata: { provider: 'stripe' } }],
  'pro',
);
if (mapped.length !== 1 || mapped[0].refId !== 'stripe/x') {
  console.error('mapVectorizeMatches failed');
  process.exit(1);
}

const live = await queryVectorizeBinding(mockBinding, 'stripe webhook', { tier: 'pro', topK: 2 });
if (!live || live.mode !== 'vectorize-live' || live.refs.length < 1) {
  console.error('queryVectorizeBinding failed', live);
  process.exit(1);
}

const broken = await queryVectorizeBinding(null, 'test');
if (broken !== null) {
  console.error('expected null for missing binding');
  process.exit(1);
}

const fallback = await retrieveRefsAsync('d1 schema migration', { tier: 'pro' });
if (fallback.mode !== 'local-bm25-stub') {
  console.error('fallback mode wrong', fallback.mode);
  process.exit(1);
}

const asyncLive = await retrieveRefsAsync('stripe webhook', { tier: 'pro', vectorize: mockBinding });
if (asyncLive.mode !== 'vectorize-live') {
  console.error('retrieveRefsAsync live failed', asyncLive);
  process.exit(1);
}

console.log('✓ g2-vectorize-adapter — mock live + local fallback');
process.exit(0);
