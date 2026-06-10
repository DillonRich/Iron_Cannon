import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { planningPath } from './repo-root.js';

function bundleJsonPath() {
  try {
    const url = import.meta?.url;
    if (url) return join(dirname(fileURLToPath(url)), 'generated/engine-bundle.json');
  } catch {
    /* Workers bundle */
  }
  return '';
}

const BUNDLE_JSON = bundleJsonPath();

let memoryStore = null;
let fileBundle = null;

/** Inject JSON map keyed by paths relative to docs/engine/ (Worker / tests). */
export function initEngineData(bundle) {
  memoryStore = bundle;
}

function normalizeKey(rel) {
  return rel.replace(/^docs\/engine\//, '').replace(/\\/g, '/');
}

function loadFileBundle() {
  if (fileBundle !== null) return fileBundle;
  if (existsSync(BUNDLE_JSON)) {
    fileBundle = JSON.parse(readFileSync(BUNDLE_JSON, 'utf8'));
  } else {
    fileBundle = {};
  }
  return fileBundle;
}

/**
 * Read engine JSON — memory → generated bundle.json → monorepo filesystem (Node).
 */
export function readEngineJson(rel) {
  const key = normalizeKey(rel);
  if (memoryStore?.[key]) return memoryStore[key];

  const bundle = loadFileBundle();
  if (bundle[key]) return bundle[key];

  const path = planningPath(key);
  if (typeof process !== 'undefined' && process.versions?.node && existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }

  throw new Error(
    `Engine data unavailable: ${key}. Run npm run build:worker-bundle or initEngineData().`,
  );
}

export function getEngineDataMode() {
  if (memoryStore) return 'memory';
  const bundle = loadFileBundle();
  if (bundle && Object.keys(bundle).length > 0) return 'bundle';
  return 'filesystem';
}

/** Find fixture spec in bundle by directory + fixtureId. */
export function findEngineFixture(dirRel, fixtureId) {
  const prefix = `specimens/fixtures/${dirRel}/`;
  const sources = [memoryStore, loadFileBundle()].filter(Boolean);
  for (const store of sources) {
    for (const [key, val] of Object.entries(store)) {
      if (key.startsWith(prefix) && val?.fixtureId === fixtureId) return val;
    }
  }
  return null;
}
