#!/usr/bin/env node
/**
 * Validates specimens against planning-phase schemas (docs/engine/phase1/schemas).
 * Does NOT require packages/ — run during markdown-code phase.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SCHEMAS_DIR = join(ROOT, 'docs/engine/phase1/schemas');
const SPECIMENS_DIR = join(ROOT, 'docs/engine/specimens');

const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
addFormats(ajv);

for (const file of readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.json'))) {
  ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf8')));
}

const validateRule = ajv.getSchema('https://ironcannon.dev/schemas/rule-fragment/v1');
const validateCard = ajv.getSchema('https://ironcannon.dev/schemas/reference-card/v1');

if (!validateRule || !validateCard) {
  console.error('Failed to load planning schemas');
  process.exit(1);
}

const SKIP_FILES = new Set(['obligation-index.specimen.json']);
const SKIP_DIRS = new Set(['fixtures']);

function globSpecimens(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) globSpecimens(p, out);
    } else if (ent.name.endsWith('.specimen.json') && !SKIP_FILES.has(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

let failed = 0;
let validated = 0;
let skipped = 0;

for (const path of globSpecimens(SPECIMENS_DIR)) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const fn =
    typeof data.refId === 'string' ? validateCard : typeof data.layer === 'number' ? validateRule : null;
  if (!fn) {
    skipped++;
    continue;
  }
  validated++;
  if (!fn(data)) {
    console.error('FAIL', path);
    console.error(JSON.stringify(fn.errors, null, 2));
    failed++;
  }
}

console.log(`Planning schema validation: ${validated} validated, ${skipped} skipped, ${failed} failed`);
process.exit(failed ? 1 : 0);
