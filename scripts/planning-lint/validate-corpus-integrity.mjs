#!/usr/bin/env node
/**
 * Iron Cannon planning integrity linter.
 * Run after every corpus/obligation batch and before psycho-analysis sign-off.
 *
 * Usage: node scripts/planning-lint/validate-corpus-integrity.mjs
 * Exit 0 = pass, 1 = failures found
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const OBLIGATION_PATH = join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json');
const DETECT_TYPES_PATH = join(ROOT, 'docs/engine/COMPARE_DETECT_TYPES.md');
const GAP_ANALYSIS_PATH = join(ROOT, 'docs/engine/GAP_ANALYSIS_FINAL.md');

const errors = [];
const warnings = [];

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function collectRefIds() {
  const refIds = new Set();
  for (const file of readdirSync(REF_DIR)) {
    if (!file.endsWith('.specimen.json')) continue;
    const data = loadJson(join(REF_DIR, file));
    if (data.refId) refIds.add(data.refId);
    else errors.push(`Missing refId: ${file}`);
    if (!data.sourceUrl) errors.push(`Missing sourceUrl: ${file}`);
    if (!data.lastVerified) warnings.push(`Missing lastVerified: ${file}`);
  }
  return refIds;
}

function extractDetectTypesFromDoc(content) {
  const types = new Set();
  const re = /### 3\.\d+ `([a-z_]+)`/g;
  let m;
  while ((m = re.exec(content)) !== null) types.add(m[1]);
  return types;
}

function main() {
  const refIds = collectRefIds();
  const obligationIndex = loadJson(OBLIGATION_PATH);
  const detectDoc = readFileSync(DETECT_TYPES_PATH, 'utf8');
  const definedDetectTypes = extractDetectTypesFromDoc(detectDoc);

  // 1. Obligation sourceRefId → card must exist
  for (const ob of obligationIndex.obligations) {
    if (!refIds.has(ob.sourceRefId)) {
      errors.push(`Orphan obligation ref: ${ob.id} → ${ob.sourceRefId} (no card)`);
    }
    const detectType = ob.detect?.type;
    if (detectType && !definedDetectTypes.has(detectType)) {
      errors.push(`Undefined detect.type: ${detectType} on ${ob.id}`);
    }
  }

  // 2. Duplicate obligation ids
  const ids = obligationIndex.obligations.map((o) => o.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) errors.push(`Duplicate obligation ids: ${[...new Set(dupes)].join(', ')}`);

  // 3. Stale GAP_ANALYSIS markers
  if (existsSync(GAP_ANALYSIS_PATH)) {
    const gap = readFileSync(GAP_ANALYSIS_PATH, 'utf8');
    if (/11 MCP tools/.test(gap)) warnings.push('GAP_ANALYSIS_FINAL still mentions "11 MCP tools"');
    if (/Cards not authored R3/.test(gap)) warnings.push('GAP_ANALYSIS_FINAL still says cards not authored');
  }

  // 4. Count summary
  const byPrefix = {};
  for (const id of refIds) {
    const prefix = id.split('/')[0];
    byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
  }

  console.log('Iron Cannon corpus integrity lint\n');
  console.log(`Reference cards: ${refIds.size}`);
  console.log(`Obligations: ${obligationIndex.obligations.length}`);
  console.log(`Detect types defined: ${definedDetectTypes.size}`);
  console.log('By provider:', JSON.stringify(byPrefix, null, 0));
  console.log('');

  if (warnings.length) {
    console.log('WARNINGS:');
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
    console.log('');
  }

  if (errors.length) {
    console.log('ERRORS:');
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log('✓ All checks passed');
  process.exit(warnings.length ? 0 : 0);
}

main();
