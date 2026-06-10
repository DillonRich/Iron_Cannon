#!/usr/bin/env node
/**
 * Chunk 6 — load rule fragments via manifest (planning-phase local loader).
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = join(ROOT, 'docs/engine/phase1/rules-manifest.json');
const ENGINE = join(ROOT, 'docs/engine');

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

export function loadModuleFragments(moduleId) {
  const manifest = loadManifest();
  const entry = manifest.modules[moduleId];
  if (!entry) throw new Error(`MODULE_NOT_IN_MANIFEST: ${moduleId}`);
  const specimenPath = join(ENGINE, entry.specimenPath);
  const fragment = JSON.parse(readFileSync(specimenPath, 'utf8'));
  return { entry, fragment };
}

function loadUnhappyPath(flowId) {
  const manifest = loadManifest();
  const bundle = manifest.flows?.[flowId]?.unhappyPathBundle;
  if (!bundle) return [];
  return JSON.parse(readFileSync(join(ENGINE, bundle), 'utf8'));
}

const tests = [
  () => {
    const { fragment } = loadModuleFragments('M01-auth-d1-schema');
    if (fragment.moduleId !== 'M01-auth-d1-schema') throw new Error('M01 moduleId mismatch');
  },
  () => {
    const { fragment } = loadModuleFragments('M12-stripe-webhook');
    if (!fragment.compliancePatterns?.required?.length) throw new Error('M12 missing patterns');
  },
  () => {
    const rules = loadUnhappyPath('billing-subscription');
    if (!rules.length) throw new Error('billing unhappy paths empty');
  },
];

const failures = [];
for (const t of tests) {
  try {
    t();
  } catch (e) {
    failures.push(e.message);
  }
}

if (failures.length) {
  console.error('Chunk 6 rule loader failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('✓ Chunk 6 rule loader — manifest + specimens + unhappy paths OK');
process.exit(0);
