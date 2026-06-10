#!/usr/bin/env node
/** Append obligation-linked imagination scenarios IMG-133+ */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const regPath = join(ROOT, 'docs/engine/planning/imagination-100-scenarios.json');
const reg = JSON.parse(readFileSync(regPath, 'utf8'));
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);

const existing = new Set(reg.scenarios.map((s) => s.id));
let n = 133;
const added = [];

for (const ob of idx.obligations) {
  const id = `IMG-${n}`;
  n++;
  if (existing.has(id)) continue;
  added.push({
    id,
    name: `Obligation ${ob.id} fixture`,
    harness: 'obligation',
    obligationId: ob.id,
    minPassRate: 0.9,
  });
}

reg.scenarios = [...reg.scenarios, ...added];
reg.scenarioCount = reg.scenarios.length;
reg.obligationWaveCount = added.length;
reg.minScenarioCount = 150;

writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Imagination obligations — +${added.length} (total ${reg.scenarioCount})`);
