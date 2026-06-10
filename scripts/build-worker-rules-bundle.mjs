#!/usr/bin/env node
/**
 * Build deployable rules bundle for MCP Worker + mcp-core engine-bundle.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'apps/mcp-worker/rules');
const BUNDLE_JSON = join(ROOT, 'packages/mcp-core/src/generated/engine-bundle.json');

const jsonFiles = [
  'planning/tier-entitlement-matrix.json',
  'planning/pattern-equivalence-registry.json',
  'phase1/rules-manifest.json',
  'specimens/fixtures/e2e/golden-path-outbound.bundle.json',
  'specimens/fixtures/e2e/pages-split-outbound.bundle.json',
  'specimens/fixtures/e2e/supabase-primary-outbound.bundle.json',
  'phase1/fixtures/armor/surface-catalog.json',
  'phase1/fixtures/armor/infrastructure-catalog.json',
  'phase1/fixtures/api-keys.dev.json',
  'specimens/obligation-index.specimen.json',
  'planning/e2e-golden-path.json',
  'planning/error-code-harness.json',
  'planning/retrieval-baseline-queries.json',
  'specimens/fixtures/obligation-calibration/calibration.bundle.json',
];

const RETRIEVAL_LITE = join(ROOT, 'packages/mcp-core/src/generated/retrieval-index-lite.json');

const MODULES_DIR = join(ROOT, 'docs/engine/specimens/fixtures/modules');
const PRO_RECOVERY_DIR = join(ROOT, 'docs/engine/specimens/fixtures/pro-recovery');

mkdirSync(OUT, { recursive: true });
mkdirSync(dirname(BUNDLE_JSON), { recursive: true });

const engineBundle = {};
const manifest = { builtAt: new Date().toISOString(), files: [], fixtures: [] };

function addJson(engineKey, srcRel) {
  const src = join(ROOT, 'docs/engine', srcRel);
  if (!existsSync(src)) {
    console.error(`Missing ${srcRel}`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(src, 'utf8'));
  engineBundle[engineKey] = data;
  const base = engineKey.replace(/\//g, '__');
  const dest = join(OUT, base);
  writeFileSync(dest, JSON.stringify(data));
  manifest.files.push({ source: `docs/engine/${engineKey}`, bundlePath: base });
}

for (const rel of jsonFiles) addJson(rel, rel);

if (!existsSync(RETRIEVAL_LITE)) {
  console.error('Run: node scripts/build-retrieval-lite.mjs');
  process.exit(1);
}
const lite = JSON.parse(readFileSync(RETRIEVAL_LITE, 'utf8'));
engineBundle['planning/retrieval-index-lite.json'] = lite;
writeFileSync(join(OUT, 'planning__retrieval-index-lite.json'), JSON.stringify(lite));
manifest.files.push({ source: 'generated/retrieval-index-lite.json', bundlePath: 'planning__retrieval-index-lite.json' });

for (const f of readdirSync(join(ROOT, 'docs/engine/specimens/fixtures/stack-detection')).filter((x) =>
  x.endsWith('.fixture-spec.json'),
)) {
  const key = `specimens/fixtures/stack-detection/${f}`;
  addJson(key, key);
  manifest.fixtures.push(key);
}

for (const f of readdirSync(join(ROOT, 'docs/engine/specimens/fixtures/wiremap')).filter((x) =>
  x.endsWith('.fixture-spec.json'),
)) {
  const key = `specimens/fixtures/wiremap/${f}`;
  addJson(key, key);
  manifest.fixtures.push(key);
}

for (const f of readdirSync(MODULES_DIR).filter((x) => x.endsWith('.fixture-spec.json'))) {
  const key = `specimens/fixtures/modules/${f}`;
  addJson(key, key);
  manifest.fixtures.push(key);
}

for (const f of readdirSync(PRO_RECOVERY_DIR).filter((x) => x.endsWith('.fixture-spec.json'))) {
  const key = `specimens/fixtures/pro-recovery/${f}`;
  addJson(key, key);
  manifest.fixtures.push(key);
}

for (const f of readdirSync(join(ROOT, 'docs/engine/specimens/fixtures/armor')).filter((x) =>
  x.endsWith('.fixture-spec.json'),
)) {
  const key = `specimens/fixtures/armor/${f}`;
  addJson(key, key);
  manifest.fixtures.push(key);
}

writeFileSync(join(OUT, 'bundle-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(BUNDLE_JSON, JSON.stringify(engineBundle) + '\n');

console.log(
  `✓ Worker rules bundle — ${manifest.files.length} JSON + ${manifest.fixtures.length} fixtures`,
);
console.log(`  → apps/mcp-worker/rules/`);
console.log(`  → packages/mcp-core/src/generated/engine-bundle.json`);
process.exit(0);
