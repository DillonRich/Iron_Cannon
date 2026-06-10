#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ADD = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-wave37-additions.json'), 'utf8'),
);
const IDX_PATH = join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json');
const idx = JSON.parse(readFileSync(IDX_PATH, 'utf8'));
const existing = new Set(idx.obligations.map((o) => o.id));

for (const ob of ADD.obligations) {
  if (!existing.has(ob.id)) {
    idx.obligations.push(ob);
    existing.add(ob.id);
  }
}
writeFileSync(IDX_PATH, JSON.stringify(idx, null, 2) + '\n');

const L4_DIR = join(ROOT, 'docs/engine/specimens/layer4');
mkdirSync(L4_DIR, { recursive: true });
for (const ob of ADD.obligations) {
  const l4Path = join(L4_DIR, `obligation-${ob.id}.specimen.json`);
  if (existsSync(l4Path)) continue;
  writeFileSync(
    l4Path,
    JSON.stringify(
      {
        $schema: 'https://ironcannon.dev/schemas/rule-fragment/v1',
        id: `layer4/obligation/${ob.id.toLowerCase()}`,
        layer: 4,
        rulesetVersion: '2026.06.03',
        content: {
          requirement: ob.title,
          obligations: [ob.id],
          compareSteps: ['Detect', 'Map', 'Disclaimer'],
          remediationDirective: ob.title,
        },
        references: [ob.sourceRefId],
        compliancePatterns: {
          required: [{ id: ob.id, type: ob.detect?.type ?? 'pattern', tier: 'ironclad' }],
        },
        metadata: { minTier: 'ironclad', category: ob.category, disclaimerRequired: true },
      },
      null,
      2,
    ) + '\n',
  );
}

const FIX_DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');
mkdirSync(FIX_DIR, { recursive: true });

function passSnippet(ob) {
  const t = ob.detect?.type ?? 'pattern';
  if (t === 'route_exists') return `export default function P(){return <main>${ob.detect.path}</main>}`;
  if (t === 'manual') return 'manualReviewCompleted=true';
  if (t === 'config') return 'verifiedDomain webhooks automatic_tax configured';
  if (t === 'ui_pattern') return `/* ${ob.detect.pattern ?? 'invoice history'} */`;
  return `pass ${ob.id}`;
}

for (const ob of ADD.obligations) {
  const fixPath = join(FIX_DIR, `${ob.id}.fixture-spec.json`);
  if (!existsSync(fixPath)) {
    writeFileSync(
      fixPath,
      JSON.stringify(
        {
          fixtureId: ob.id,
          obligationId: ob.id,
          detectType: ob.detect?.type ?? 'pattern',
          detect: ob.detect ?? { type: 'pattern' },
          passSnippet: passSnippet(ob),
          failSnippet: 'gap',
          expectedPass: 'met',
          expectedFail: 'gap',
        },
        null,
        2,
      ) + '\n',
    );
  }
}

const fix = spawnSync(
  process.execPath,
  [join(ROOT, 'scripts/planning-lint/fix-obligation-fixtures-wave30.mjs')],
  { cwd: ROOT, stdio: 'inherit' },
);

if (fix.status !== 0) process.exit(fix.status);
if (idx.obligations.length < 80) {
  console.error(`Need 80 obligations, got ${idx.obligations.length}`);
  process.exit(1);
}
console.log(`✓ Wave37 — ${idx.obligations.length} obligations`);
