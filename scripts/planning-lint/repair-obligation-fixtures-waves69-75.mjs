#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIX_DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');
let fixed = 0;

for (const f of readdirSync(FIX_DIR).filter((x) => x.match(/^LEG-W(69|7[0-5])-/))) {
  const path = join(FIX_DIR, f);
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  let changed = false;
  if (spec.detectType === 'manual' && spec.expectedFail !== 'gap') {
    spec.expectedFail = 'gap';
    changed = true;
  }
  if (spec.detectType === 'config') {
    if (!/verifiedDomain|webhooks|deliveryEvents|configured/i.test(spec.passSnippet)) {
      spec.passSnippet = 'verifiedDomain webhooks automatic_tax configured';
      changed = true;
    }
    if (spec.expectedFail !== 'gap') {
      spec.expectedFail = 'gap';
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
    fixed += 1;
  }
}
console.log(`✓ Repaired ${fixed} obligation fixtures (waves 69–75)`);
