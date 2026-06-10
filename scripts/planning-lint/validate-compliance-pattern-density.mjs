#!/usr/bin/env node
/** P0-T061 — ≥10 verifiable auth + ≥10 billing patterns across module specimens */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SPEC_DIR = join(ROOT, 'docs/engine/specimens');
const MODULE_FIX = join(ROOT, 'docs/engine/specimens/fixtures/modules');

const authIds = new Set();
const billIds = new Set();

function collectFromJson(obj) {
  for (const p of obj.compliancePatterns?.required ?? []) {
    const id = p.id ?? '';
    if (/^AUTH/i.test(id)) authIds.add(id);
    if (/^(BILL|STWH|CHECK|PROV)/i.test(id)) billIds.add(id);
  }
}

for (const f of readdirSync(SPEC_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  collectFromJson(JSON.parse(readFileSync(join(SPEC_DIR, f), 'utf8')));
}

for (const f of readdirSync(MODULE_FIX).filter((x) => x.endsWith('.fixture-spec.json'))) {
  const spec = JSON.parse(readFileSync(join(MODULE_FIX, f), 'utf8'));
  for (const id of spec.patternsUnderTest ?? []) {
    if (/^AUTH|^PW/i.test(id)) authIds.add(id);
    if (/^(BILL|STWH|CHECK|PROV)/i.test(id)) billIds.add(id);
  }
}

const failures = [];
const MIN_AUTH = 20;
const MIN_BILL = 20;
if (authIds.size < MIN_AUTH) failures.push(`auth patterns ${authIds.size} < ${MIN_AUTH}`);
if (billIds.size < MIN_BILL) failures.push(`billing patterns ${billIds.size} < ${MIN_BILL}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Compliance pattern density — auth ${authIds.size}, billing ${billIds.size}`);
process.exit(0);
