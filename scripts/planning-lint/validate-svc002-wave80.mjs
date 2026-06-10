#!/usr/bin/env node
/** SVC-002 wave 80 exit — harvest, SD-07 wiremap, 72 journeys, obligations. */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { composeWiremaps } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

const required = [
  'docs/engine/specimens/fixtures/e2e/supabase-primary-outbound.bundle.json',
  'docs/engine/specimens/fixtures/wiremap/w07-supabase-primary.fixture-spec.json',
  'docs/engine/specimens/obligation-wave80-additions.json',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) failures.push(`missing ${rel}`);
}

const wm = composeWiremaps({ stackId: 'SD-07' });
const ids = wm.wiremaps?.[0]?.moduleIds ?? [];
if (ids.length !== 8) failures.push(`SD-07 wiremap: want 8 modules, got ${ids.length}`);
if (ids[0] !== 'M70-supabase-auth-config') failures.push('SD-07 wiremap must start with M70');
if (ids[1] !== 'M71-supabase-middleware-ssr') failures.push('SD-07 wiremap must include M71 second');

const bundle = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/fixtures/e2e/supabase-primary-outbound.bundle.json'), 'utf8'),
);
if (bundle.stackId !== 'SD-07') failures.push('supabase-primary bundle missing stackId SD-07');
if ((bundle.moduleOrder?.length ?? 0) !== 8) failures.push('supabase-primary bundle moduleOrder length');

const REF = join(ROOT, 'docs/engine/specimens/references');
const svcCards = readdirSync(REF).filter((f) => f.includes('svc002-supabase'));
if (svcCards.length < 40) failures.push(`svc002 supabase cards: ${svcCards.length} < 40`);

const uj = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/user-journey-behavioral-scenarios.json'), 'utf8'),
);
if ((uj.scenarios?.length ?? 0) < 72) failures.push(`user journeys: ${uj.scenarios?.length} < 72`);

const idx = JSON.parse(readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'));
const w80 = idx.obligations.filter((o) => o.id.startsWith('LEG-W80-'));
if (w80.length < 10) failures.push(`LEG-W80 obligations: ${w80.length} < 10`);

const gr = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/gap-register.json'), 'utf8'));
const g31 = gr.gaps.find((g) => g.id === 'G-31');
if (!g31 || g31.status !== 'closed') failures.push('G-31 must be closed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✓ SVC-002 wave80 — ${svcCards.length} supabase cards, ${uj.scenarios.length} journeys, ${w80.length} obligations`,
);
process.exit(0);
