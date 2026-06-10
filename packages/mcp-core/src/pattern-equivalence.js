import { readEngineJson } from './engine-data.js';

let registryCache = null;

export function loadPatternEquivalenceRegistry() {
  if (!registryCache) {
    try {
      registryCache = readEngineJson('planning/pattern-equivalence-registry.json');
    } catch {
      registryCache = { patterns: {}, prefixPatterns: [] };
    }
  }
  return registryCache;
}

/** Reset for tests. */
export function resetPatternEquivalenceCache() {
  registryCache = null;
}

export function registryExactMatch(patternId, hay) {
  const reg = loadPatternEquivalenceRegistry();
  const entry = reg.patterns?.[patternId];
  if (!entry?.match) return null;
  return new RegExp(entry.match, 'i').test(hay);
}

export function registryPrefixMatch(patternId, hay) {
  const reg = loadPatternEquivalenceRegistry();
  const rules = [...(reg.prefixPatterns ?? [])].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of rules) {
    if (patternId.startsWith(rule.prefix) && rule.match) {
      return new RegExp(rule.match, 'i').test(hay);
    }
  }
  return null;
}

export function patternMatchesRegistry(patternId, snippet) {
  const hay = String(snippet ?? '');
  const exact = registryExactMatch(patternId, hay);
  if (exact !== null) return exact;
  const prefix = registryPrefixMatch(patternId, hay);
  if (prefix !== null) return prefix;
  return null;
}
