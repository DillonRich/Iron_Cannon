#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ADD = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-wave62-additions.json'), 'utf8'),
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
  if (t === 'route_exists') return `export default function P(){return <main>${ob.detect.path}</main>}`;
  if (t === 'manual') return 'manualReviewCompleted=true';
  if (t === 'config') return 'verifiedDomain webhooks automatic_tax configured';
  if (t === 'ui_pattern') return `/* shows ${ob.detect.pattern ?? 'compliant'} */`;
  if (t === 'flow_ref') return `flowRef ${ob.detect.flow}`;
  if (t === 'header') return 'List-Unsubscribe: <mailto:unsub@example.com>';
  if (t === 'script_before_consent') return 'consentGate blocks analytics until accept';
  if (t === 'schema_table') return `table ${ob.detect.table}`;
  if (t === 'schema_column') return `column ${ob.detect.column}`;
  if (t === 'required_attribute') return `${ob.detect.attr}=${ob.detect.value}`;
  if (t === 'pattern') return `notice ${ob.detect.pattern}`;
  return `pass ${ob.id}`;
}

function failSnippet(ob) {
  const t = ob.detect?.type ?? 'pattern';
  if (t === 'manual') return 'gap';
  if (t === 'ui_pattern') return 'defaultChecked=true';
  if (t === 'script_before_consent') return 'analytics.js loads before banner';
  if (t === 'route_exists') return '<main>/missing</main>';
  if (t === 'flow_ref') return 'flowRef unknown-flow';
  if (t === 'header') return 'Subject: hello';
  if (t === 'config') return 'incomplete';
  if (t === 'pattern') return 'no match here';
  if (t === 'required_attribute') return `${ob.detect.attr}=none`;
  if (t === 'schema_table') return 'table other';
  if (t === 'schema_column') return 'column other';
  return 'gap';
}

for (const ob of ADD.obligations) {
  const fixPath = join(FIX_DIR, `${ob.id}.fixture-spec.json`);
  const detectType = ob.detect?.type ?? 'pattern';
  const spec = {
    fixtureId: ob.id,
    obligationId: ob.id,
    detectType,
    detect: ob.detect ?? { type: detectType },
    passSnippet: passSnippet(ob),
    failSnippet: failSnippet(ob),
    expectedPass: 'met',
    expectedFail: 'gap',
  };
  if (!existsSync(fixPath)) {
    writeFileSync(fixPath, JSON.stringify(spec, null, 2) + '\n');
  }
}

console.log(`✓ wave62 obligations — ${idx.obligations.length} total`);
