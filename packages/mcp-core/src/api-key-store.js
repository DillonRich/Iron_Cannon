import { createHash } from 'crypto';
import { readEngineJson } from './engine-data.js';

const KEY_RE = /^ic_(dev|live|test)_(pro|armor|ironclad)_([a-z0-9]{8,64})$/i;

export function hashApiKey(token) {
  return createHash('sha256').update(token).digest('hex');
}

function parseEnvRegistry(envJson) {
  if (!envJson) return [];
  try {
    const parsed = JSON.parse(envJson);
    return parsed.keys ?? parsed;
  } catch {
    return [];
  }
}

function loadRegistry(opts = {}) {
  const keys = [];
  keys.push(...parseEnvRegistry(process.env.IRON_CANNON_API_KEYS));
  if (opts.env?.API_KEYS_JSON) keys.push(...parseEnvRegistry(opts.env.API_KEYS_JSON));
  try {
    const file = readEngineJson('phase1/fixtures/api-keys.dev.json');
    keys.push(...(file.keys ?? []));
  } catch {
    /* dev file optional until bundle built */
  }
  return keys;
}

/** Match token against dev registry (sync). */
export function lookupDevRegistry(token, opts = {}) {
  if (!token) return null;
  const hash = hashApiKey(token);
  for (const row of loadRegistry(opts)) {
    if (row.token === token || row.hash === hash) {
      if (row.revoked) {
        return { ok: false, error: 'SUBSCRIPTION_INACTIVE', message: 'API key revoked' };
      }
      if (row.subscriptionStatus && row.subscriptionStatus !== 'active' && row.subscriptionStatus !== 'trialing') {
        return { ok: false, error: 'SUBSCRIPTION_INACTIVE', message: `Subscription ${row.subscriptionStatus}` };
      }
      return {
        ok: true,
        tier: row.tier ?? 'pro',
        clientId: row.clientId ?? row.userId ?? `dev:${row.label ?? 'key'}`,
        keyEnv: 'dev',
        source: 'registry',
      };
    }
  }
  return null;
}

/**
 * D1 lookup stub — Worker passes env.DB (D1 binding).
 * Schema: api_keys(key_hash TEXT PRIMARY KEY, tier TEXT, user_id TEXT, revoked_at TEXT)
 */
export async function lookupD1ApiKey(d1, token) {
  if (!d1?.prepare || !token) return null;
  const keyHash = hashApiKey(token);
  try {
    const row = await d1
      .prepare(
        `SELECT k.tier, k.user_id AS userId, k.revoked_at AS revokedAt, s.status AS subscriptionStatus
         FROM api_keys k
         LEFT JOIN subscriptions s ON s.user_id = k.user_id
         WHERE k.key_hash = ?`,
      )
      .bind(keyHash)
      .first();
    if (!row?.tier) return null;
    if (row.revokedAt) {
      return { ok: false, error: 'SUBSCRIPTION_INACTIVE', message: 'API key revoked' };
    }
    const sub = row.subscriptionStatus;
    if (sub && sub !== 'active' && sub !== 'trialing') {
      return { ok: false, error: 'SUBSCRIPTION_INACTIVE', message: `Subscription ${sub}` };
    }
    return {
      ok: true,
      tier: String(row.tier).toLowerCase(),
      clientId: row.userId ?? `d1:${keyHash.slice(0, 8)}`,
      keyEnv: 'live',
      source: 'd1',
    };
  } catch {
    return null;
  }
}

export function parseKeyFormat(token) {
  const m = KEY_RE.exec(token);
  if (!m) return { ok: false, error: 'AUTH_INVALID', message: 'Invalid API key format' };
  return {
    ok: true,
    tier: m[2].toLowerCase(),
    clientId: `key:${m[3].slice(0, 12)}`,
    keyEnv: m[1].toLowerCase(),
    source: 'format',
  };
}

/** Full lookup: dev registry → D1 → format parse. */
export async function resolveApiKey(token, ctx = {}, opts = {}) {
  if (!token) return null;

  if (process.env.IRON_CANNON_DEV_KEY && token === process.env.IRON_CANNON_DEV_KEY) {
    return {
      ok: true,
      tier: ctx.tier ?? 'pro',
      clientId: 'dev-key',
      source: 'env-bypass',
    };
  }

  const reg = lookupDevRegistry(token, opts);
  if (reg) return reg;

  const d1 = opts.d1 ?? opts.env?.DB;
  const dbRow = await lookupD1ApiKey(d1, token);
  if (dbRow) return dbRow;

  return parseKeyFormat(token);
}
