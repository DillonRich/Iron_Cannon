import { filterComposedSlice } from '@ironcannon/compose';
import { loadTierMatrix } from './tier-gate.js';
import { readEngineJson } from './engine-data.js';
import { validateModuleSequence } from './module-sequence.js';
import { retrieveForModule, retrieveForModuleAsync } from './retrieval.js';
import { getSnippetHint } from './snippet-hints.js';

let bundleCache;
let manifestCache;

function loadBundle() {
  if (!bundleCache) {
    bundleCache = readEngineJson('specimens/fixtures/e2e/golden-path-outbound.bundle.json');
    try {
      const pages = readEngineJson('specimens/fixtures/e2e/pages-split-outbound.bundle.json');
      bundleCache = {
        ...bundleCache,
        modules: { ...bundleCache.modules, ...pages.modules },
      };
    } catch {
      /* SD-06 pages-split bundle optional until SVC-001 wave 78 */
    }
    try {
      const supa = readEngineJson('specimens/fixtures/e2e/supabase-primary-outbound.bundle.json');
      bundleCache = {
        ...bundleCache,
        modules: { ...bundleCache.modules, ...supa.modules },
      };
    } catch {
      /* SD-07 supabase-primary bundle optional until SVC-002 wave 80 */
    }
  }
  return bundleCache;
}

function loadManifest() {
  if (!manifestCache) manifestCache = readEngineJson('phase1/rules-manifest.json');
  return manifestCache;
}

function normalizeRefId(id) {
  if (!id) return id;
  if (id.includes('/')) return id;
  if (/^AUTH-|^BILL-|^STRIPE-|^LEG-/.test(id)) {
    if (id.startsWith('AUTH-') || id.startsWith('BILL-')) return `cloudflare/${id.toLowerCase()}`;
  }
  return `stripe/${id}`;
}

function mergeRetrievalHits(slice, retrieval) {
  if (!retrieval?.refs?.length) return;
  const existing = new Set(slice.referenceCards.map((c) => c.refId));
  for (const hit of retrieval.refs) {
    if (hit.score > 0 && !existing.has(hit.refId)) {
      slice.referenceCards.push({ refId: hit.refId, kind: 'retrieved', score: hit.score });
      existing.add(hit.refId);
    }
  }
}

function buildT04Slice(moduleId, tier, opts = {}) {
  const bundle = loadBundle();
  const manifest = loadManifest();
  const matrix = loadTierMatrix();
  const ent = matrix.composeEntitlements[tier] ?? matrix.composeEntitlements.pro;

  if (opts.completedModules) {
    const seq = validateModuleSequence(moduleId, opts.completedModules);
    if (!seq.ok) return seq;
  }

  const mod = bundle.modules?.[moduleId];
  if (!mod) return { ok: false, error: 'MODULE_NOT_FOUND', message: moduleId };
  if (!manifest.modules?.[moduleId]) {
    return { ok: false, error: 'MODULE_NOT_FOUND', message: `${moduleId} not in manifest` };
  }

  const exp = mod.expected ?? {};
  const patternIds = (exp.requiredPatternIds ?? []).slice(0, ent.t04MaxExplicitCards ?? 8);
  const refIds = (exp.requiredRefIds ?? []).filter((rid) => {
    if (ent.forbiddenRefIdPrefixes?.length) {
      return !ent.forbiddenRefIdPrefixes.some((p) => rid.startsWith(p));
    }
    return true;
  });

  const slice = {
    ruleFragments: (mod.fragmentIds ?? []).map((id) => ({
      layer: id.startsWith('layer1/') ? 'L1' : 'L2',
      id,
    })),
    mapNodes: [{ type: 'module', moduleId, flowId: mod.flowId }],
    referenceCards: [
      ...patternIds.map((id) => ({ refId: normalizeRefId(id), kind: 'pattern' })),
      ...refIds.map((refId) => ({ refId, kind: 'vendor' })),
    ],
    outbound: { ...exp },
  };

  let retrieval;
  if (opts.useRetrieval !== false) {
    retrieval = opts.retrieval ?? retrieveForModule(moduleId, tier, { vectorize: opts.vectorize });
    mergeRetrievalHits(slice, retrieval);
  }

  return { slice, mod, exp, ent, bundle, manifest, retrieval };
}

/**
 * Build T04 module directive payload with tier entitlements + golden outbound contract.
 */
export function composeModuleDirective(moduleId, tier = 'pro', opts = {}) {
  const built = buildT04Slice(moduleId, tier, opts);
  if (!built.ok && built.error) return built;
  const { slice, mod, exp, ent, bundle, manifest, retrieval } = built;
  const filtered = filterComposedSlice(slice, tier);

  const snippetHint = getSnippetHint(moduleId);

  return {
    ok: true,
    toolId: 'T04',
    moduleId,
    tier,
    rulesetVersion: bundle.rulesetVersion ?? manifest.rulesetVersion,
    slice: filtered,
    presentationHints: {
      category: mod.flowId?.includes('billing') ? 'billing' : 'auth',
      priority: 'high',
    },
    ...(snippetHint ? { snippetHint } : {}),
    agentGuidance: {
      phase: 'IMPLEMENT',
      instruction: snippetHint
        ? `Implement ${moduleId}; verify with T05 using symbols in snippetHint before next module.`
        : `Implement ${moduleId}; verify with T05 before next module.`,
    },
    verifyBeforeProceed: exp.verifyGateBlocksNext !== false,
    meta: {
      sliceProfile: exp.sliceProfile ?? 'module_directive',
      maxOutboundTokens: exp.maxOutboundTokens ?? 16000,
      ragTopK: ent.t04RagTopK ?? 5,
      retrieval: retrieval ?? null,
    },
  };
}

/** T04 with live Vectorize when binding present (Worker). */
export async function composeModuleDirectiveAsync(moduleId, tier = 'pro', opts = {}) {
  const asyncOpts = { ...opts };
  if (opts.useRetrieval !== false && opts.vectorize && !opts.retrieval) {
    asyncOpts.retrieval = await retrieveForModuleAsync(moduleId, tier, {
      vectorize: opts.vectorize,
    });
  }
  return composeModuleDirective(moduleId, tier, asyncOpts);
}
