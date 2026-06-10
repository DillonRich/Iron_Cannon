import { loadTierMatrix } from './tier-gate.js';

const windows = new Map();

function limitsForTier(tier) {
  const matrix = loadTierMatrix();
  return matrix.rateLimits?.[tier] ?? matrix.rateLimits?.pro ?? { perMinute: 30 };
}

function rateLimitError(tier, perMinute, retryAfterSec) {
  return {
    ok: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: `${tier} limit ${perMinute}/min`,
    retryAfterSec,
  };
}

/**
 * In-memory rate limit (per Worker isolate).
 */
export function checkRateLimitMemory(tier, clientKey = 'global') {
  const perMinute = limitsForTier(tier).perMinute ?? 30;
  const key = `${tier}:${clientKey}`;
  const now = Date.now();
  let bucket = windows.get(key);
  if (!bucket || now - bucket.windowStart > 60_000) {
    bucket = { windowStart: now, count: 0 };
    windows.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > perMinute) {
    return rateLimitError(tier, perMinute, Math.ceil((bucket.windowStart + 60_000 - now) / 1000));
  }
  return null;
}

/**
 * Cloudflare KV rate limit (minute buckets, multi-instance safe).
 */
export async function checkRateLimitKv(kv, tier, clientKey = 'global') {
  if (!kv?.get) return null;
  const perMinute = limitsForTier(tier).perMinute ?? 30;
  const windowId = Math.floor(Date.now() / 60_000);
  const key = `rl:${tier}:${clientKey}:${windowId}`;
  const raw = await kv.get(key);
  const count = parseInt(raw ?? '0', 10);
  if (count >= perMinute) {
    return rateLimitError(tier, perMinute, 60 - (Math.floor(Date.now() / 1000) % 60));
  }
  await kv.put(key, String(count + 1), { expirationTtl: 120 });
  return null;
}

/** Prefer KV when bound; else in-memory. */
export async function checkRateLimitAsync(tier, clientKey = 'global', opts = {}) {
  if (opts.kv) {
    const kvResult = await checkRateLimitKv(opts.kv, tier, clientKey);
    if (kvResult) return kvResult;
  }
  return checkRateLimitMemory(tier, clientKey);
}

/** @deprecated sync — use checkRateLimitAsync */
export function checkRateLimit(tier, clientKey = 'global') {
  return checkRateLimitMemory(tier, clientKey);
}

/** Test harness — clear in-memory buckets between suites. */
export function resetRateLimitForTests() {
  windows.clear();
}
