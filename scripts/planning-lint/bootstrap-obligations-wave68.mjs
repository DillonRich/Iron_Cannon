#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ADD = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-wave68-additions.json'), 'utf8'),
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
        rulesetVersion: '2026.06.06',
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
  if (t === 'manual') return 'manualReviewCompleted=true';
  if (t === 'config') return 'verifiedDomain webhooks automatic_tax configured';
  if (t === 'pattern') return `notice ${ob.detect.pattern ?? 'compliant'}`;
  return `pass ${ob.id}`;
}

function failSnippet(ob) {
  if ((ob.detect?.type ?? 'pattern') === 'manual') return 'gap';
  return 'gap';
}

for (const ob of ADD.obligations) {
  const fixPath = join(FIX_DIR, `${ob.id}.fixture-spec.json`);
  const detectType = ob.detect?.type ?? 'pattern';
  if (!existsSync(fixPath)) {
    writeFileSync(
      fixPath,
      JSON.stringify(
        {
          fixtureId: ob.id,
          obligationId: ob.id,
          detectType,
          detect: ob.detect ?? { type: detectType },
          passSnippet: passSnippet(ob),
          failSnippet: failSnippet(ob),
          expectedPass: 'met',
          expectedFail: 'gap',
        },
        null,
        2,
      ) + '\n',
    );
  }
}

console.log(`✓ wave68 obligations — ${idx.obligations.length} total`);
