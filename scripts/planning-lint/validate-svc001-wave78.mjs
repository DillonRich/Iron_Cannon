#!/usr/bin/env node
/** SVC-001 wave 78 exit — harvest, SD-06 wiremap, 61 journeys, obligations. */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { composeWiremaps } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const required = [
  'docs/engine/specimens/fixtures/e2e/pages-split-outbound.bundle.json',
  'docs/engine/specimens/fixtures/wiremap/w06-pages-worker-split.fixture-spec.json',
  'docs/engine/specimens/obligation-wave78-additions.json',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const wm = composeWiremaps({ stackId: 'SD-06' });
const ids = wm.wiremaps?.[0]?.moduleIds ?? [];
if (ids.length !== 14) failures.push(`SD-06 wiremap: want 14 modules, got ${ids.length}`);
if (ids[0] !== 'M60-pages-wrangler-config') failures.push('SD-06 wiremap must start with M60');
if (ids[1] !== 'M61-pages-env-bridge') failures.push('SD-06 wiremap must include M61 second');

const bundle = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/fixtures/e2e/pages-split-outbound.bundle.json'), 'utf8'),
);
if (bundle.stackId !== 'SD-06') failures.push('pages-split bundle missing stackId SD-06');
if ((bundle.moduleOrder?.length ?? 0) !== 14) failures.push('pages-split bundle moduleOrder length');

const REF = join(ROOT, 'docs/engine/specimens/references');
const svcCards = readdirSync(REF).filter((f) => f.includes('svc001-pages'));
if (svcCards.length < 40) failures.push(`svc001 pages cards: ${svcCards.length} < 40`);

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 61) failures.push(`user journeys: ${uj.scenarios?.length} < 61`);

const idx = JSON.parse(readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'));
const w78 = idx.obligations.filter((o) => o.id.startsWith('LEG-W78-'));
if (w78.length < 10) failures.push(`LEG-W78 obligations: ${w78.length} < 10`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g28 = gr.gaps.find((g) => g.id === 'G-28');
if (!g28 || g28.status !== 'closed') failures.push('G-28 must be closed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ SVC-001 wave78 — ${svcCards.length} pages cards, ${uj.scenarios.length} journeys, ${w78.length} obligations`,
);
process.exit(0);
