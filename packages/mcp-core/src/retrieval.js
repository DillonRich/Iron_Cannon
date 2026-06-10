import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readEngineJson } from './engine-data.js';
import { loadTierMatrix } from './tier-gate.js';

const LITE_PATH = (() => {
  try {
    const url = import.meta?.url;
    if (url) return join(dirname(fileURLToPath(url)), 'generated/retrieval-index-lite.json');
  } catch {
    /* Workers bundle */
  }
  return '';
})();

/** Module → retrieval query (golden + common). */
const MODULE_QUERIES = {
  'M01-auth-d1-schema': 'cloudflare d1 migrations users sessions schema',
  'M02-auth-worker-routes': 'cloudflare worker auth routes signup signin api',
  'M03-auth-resend-emails': 'resend verified domain transactional email idempotency',
  'M04-auth-ui-routes': 'nextjs terms privacy label form signup',
  'M05-auth-session-middleware': 'nextjs middleware session protected routes',
  'M10-billing-d1-schema': 'stripe subscription d1 schema billing',
  'M11-stripe-checkout-route': 'stripe checkout session subscription mode',
  'M12-stripe-webhook': 'stripe webhook signature verify raw body constructEvent',
  'M13-provisioning-kv': 'cloudflare kv provisioning idempotency stripe',
  'M14-billing-success-ui': 'billing success page router refresh nextjs',
  'M15-billing-dashboard-ui': 'stripe billing portal customer subscription status',
  'M16-billing-emails': 'resend billing subscription email template',
};

let liteIndex;
let fullIndex;

function tokens(s) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function scoreEntry(queryTok, entry) {
  const hay = `${entry.refId} ${entry.hint ?? ''}`.toLowerCase();
  let s = 0;
  for (const t of queryTok) {
    if (hay.includes(t)) s += 1;
    if (entry.refId.toLowerCase().includes(t)) s += 2;
  }
  return s;
}

function loadLiteIndex() {
  if (liteIndex) return liteIndex;
  try {
    liteIndex = readEngineJson('planning/retrieval-index-lite.json');
  } catch {
    if (existsSync(LITE_PATH)) {
      liteIndex = JSON.parse(readFileSync(LITE_PATH, 'utf8'));
    } else {
      liteIndex = { entries: [] };
    }
  }
  return liteIndex;
}

function loadFullIndex() {
  if (fullIndex) return fullIndex;
  try {
    fullIndex = readEngineJson('specimens/reference-index.specimen.json');
  } catch {
    fullIndex = loadLiteIndex();
  }
  return fullIndex;
}

function applyTierFilter(refs, tier) {
  const matrix = loadTierMatrix();
  const ent = matrix.composeEntitlements[tier] ?? matrix.composeEntitlements.pro;
  if (!ent.forbiddenRefIdPrefixes?.length) return refs;
  return refs.filter(
    (r) => !ent.forbiddenRefIdPrefixes.some((p) => r.refId.startsWith(p)),
  );
}

function rankLocal(query, opts = {}) {
  const tier = opts.tier ?? 'pro';
  const matrix = loadTierMatrix();
  const ent = matrix.composeEntitlements[tier] ?? matrix.composeEntitlements.pro;
  const topK = opts.topK ?? ent.t04RagTopK ?? 5;
  const index = opts.fullIndex ? loadFullIndex() : loadLiteIndex();
  const qt = tokens(query);
  return applyTierFilter(
    [...(index.entries ?? [])]
      .map((e) => ({ refId: e.refId, score: scoreEntry(qt, e), provider: e.provider }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK),
    tier,
  );
}

/** Map Cloudflare Vectorize query() matches → ref hits. */
export function mapVectorizeMatches(matches = [], tier = 'pro') {
  const refs = matches.map((m) => ({
    refId: m.id ?? m.refId ?? String(m),
    score: m.score ?? 0,
    provider: m.metadata?.provider,
    hint: m.metadata?.hint,
  }));
  return applyTierFilter(refs, tier);
}

/**
 * Query live Vectorize binding; returns null on missing binding or error (caller falls back).
 */
export async function queryVectorizeBinding(binding, query, opts = {}) {
  if (!binding?.query) return null;
  const tier = opts.tier ?? 'pro';
  const matrix = loadTierMatrix();
  const ent = matrix.composeEntitlements[tier] ?? matrix.composeEntitlements.pro;
  const topK = opts.topK ?? ent.t04RagTopK ?? 5;
  try {
    const res = await binding.query({
      topK,
      returnMetadata: true,
      data: query,
    });
    const refs = mapVectorizeMatches(res?.matches ?? [], tier);
    if (!refs.length) return null;
    return { query, mode: 'vectorize-live', refs };
  } catch {
    return null;
  }
}

/**
 * Local retrieval (BM25 stub). Use retrieveRefsAsync when Worker Vectorize binding is available.
 */
export function retrieveRefs(query, opts = {}) {
  const ranked = rankLocal(query, opts);
  return {
    query,
    mode: 'local-bm25-stub',
    refs: ranked,
  };
}

export async function retrieveRefsAsync(query, opts = {}) {
  if (opts.vectorize) {
    const live = await queryVectorizeBinding(opts.vectorize, query, opts);
    if (live) return live;
  }
  return retrieveRefs(query, opts);
}

export function retrieveForModule(moduleId, tier = 'pro', opts = {}) {
  const query =
    MODULE_QUERIES[moduleId] ??
    `${moduleId} compliance patterns cloudflare stripe nextjs`;
  return retrieveRefs(query, { tier, ...opts });
}

export async function retrieveForModuleAsync(moduleId, tier = 'pro', opts = {}) {
  const query =
    MODULE_QUERIES[moduleId] ??
    `${moduleId} compliance patterns cloudflare stripe nextjs`;
  return retrieveRefsAsync(query, { tier, ...opts });
}
