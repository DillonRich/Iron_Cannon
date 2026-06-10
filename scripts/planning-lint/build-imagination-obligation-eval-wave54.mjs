#!/usr/bin/env node
/** Append obligation-eval imagination scenarios for all 100 obligations */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const reg = JSON.parse(readFileSync(regPath, 'utf8'));
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);

const haveEval = new Set(
  reg.scenarios.filter((s) => s.harness === 'obligation-eval').map((s) => s.obligationId),
);
let n = Math.max(0, ...reg.scenarios.map((s) => parseInt(String(s.id).replace('IMG-', ''), 10) || 0)) + 1;
const added = [];

for (const ob of idx.obligations) {
  if (haveEval.has(ob.id)) continue;
  added.push({
    id: `IMG-${n++}`,
    name: `Eval ${ob.id}`,
    harness: 'obligation-eval',
    obligationId: ob.id,
    minPassRate: 0.9,
  });
}

reg.scenarios = [...reg.scenarios, ...added];
reg.scenarioCount = reg.scenarios.length;
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Obligation-eval imagination — +${added.length} (total ${reg.scenarioCount})`);
