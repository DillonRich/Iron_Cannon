#!/usr/bin/env node
/** Phase F imagination — EC-013 full compose + corpus scale-b gate */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const reg = JSON.parse(readFileSync(regPath, 'utf8'));

let n =
  Math.max(
    0,
    ...reg.scenarios.map((s) => parseInt(String(s.id).replace('IMG-', ''), 10) || 0),
  ) + 1;

const added = [];
function push(s) {
  if (reg.scenarios.some((x) => x.id === s.id)) return;
  added.push(s);
  reg.scenarios.push(s);
}

push({
  id: `IMG-${n++}`,
  name: 'EC-013 compose tier full sim',
  harness: 'compose-ec013',
  minPassRate: 1,
});
push({
  id: `IMG-${n++}`,
  name: 'Corpus scale-b coverage doc',
  harness: 'doc',
  path: 'harvest-data/corpus-coverage.json',
});
push({
  id: `IMG-${n++}`,
  name: 'Scale-B harvest queue executed',
  harness: 'doc',
  path: 'docs/engine/planning/scale-b-harvest-queue.json',
});

reg.scenarioCount = reg.scenarios.length;
reg.phaseFCount = added.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination Phase F — +${added.length} (total ${reg.scenarioCount})`);
