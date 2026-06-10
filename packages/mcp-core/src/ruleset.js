import { readEngineJson } from './engine-data.js';

let cached;

/** Ruleset version from bundled manifest (SSOT for responses). */
export function getRulesetVersion() {
  if (cached) return cached;
  try {
    const manifest = readEngineJson('phase1/rules-manifest.json');
    cached = manifest.rulesetVersion ?? '2026.06.04';
  } catch {
    cached = process.env.RULESET_VERSION ?? '2026.06.04';
  }
  return cached;
}
