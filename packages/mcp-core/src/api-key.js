/**
 * API key validation — dev registry, D1 stub, format fallback.
 */
import { resolveApiKey } from './api-key-store.js';

export {
  hashApiKey,
  lookupDevRegistry,
  lookupD1ApiKey,
  resolveApiKey,
} from './api-key-store.js';

export function extractApiKey(ctx = {}) {
  if (ctx.apiKey) return String(ctx.apiKey).trim();
  const auth = ctx.authorization ?? ctx.headers?.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return ctx.headers?.['x-ironcannon-api-key']?.trim() ?? null;
}

export async function validateApiKey(ctx = {}, opts = {}) {
  const key = extractApiKey(ctx);
  const requireKey =
    opts.requireApiKey === true ||
    process.env.IRON_CANNON_REQUIRE_API_KEY === '1' ||
    opts.env?.REQUIRE_API_KEY === '1';

  if (!key) {
    if (requireKey) {
      return { ok: false, error: 'AUTH_MISSING', message: 'API key required' };
    }
    return { ok: true, tier: ctx.tier ?? 'pro', clientId: ctx.clientKey ?? 'anonymous' };
  }

  const resolved = await resolveApiKey(key, ctx, opts);
  if (!resolved?.ok) {
    return resolved ?? { ok: false, error: 'AUTH_INVALID', message: 'Invalid API key' };
  }

  const headerTier = ctx.tier;
  return {
    ok: true,
    tier: headerTier && headerTier !== 'pro' ? headerTier : resolved.tier,
    clientId: resolved.clientId,
    keyEnv: resolved.keyEnv,
    keySource: resolved.source,
  };
}
