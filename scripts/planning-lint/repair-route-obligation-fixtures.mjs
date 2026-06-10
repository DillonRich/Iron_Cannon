#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { evaluateCompare } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');
const IDS = ['LEG-EMAIL-010', 'LEG-DATA-002', 'LEG-SEC-001'];

for (const id of IDS) {
  const path = join(DIR, `${id}.fixture-spec.json`);
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  spec.failSnippet = '<main>/missing-route</main>';
  spec.expectedPass = evaluateCompare(spec.detectType, spec.passSnippet, spec.detect);
  spec.expectedFail = evaluateCompare(spec.detectType, spec.failSnippet, spec.detect);
  writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
}
console.log(`✓ Repaired route fixtures — ${IDS.join(', ')}`);
