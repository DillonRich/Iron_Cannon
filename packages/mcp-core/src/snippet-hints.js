import { readEngineJson } from './engine-data.js';

let cache;

export function getSnippetHint(moduleId) {
  if (!cache) {
    try {
      cache = readEngineJson('planning/snippet-hint-registry.json');
    } catch {
      cache = { hints: {} };
    }
  }
  return cache.hints?.[moduleId] ?? null;
}
