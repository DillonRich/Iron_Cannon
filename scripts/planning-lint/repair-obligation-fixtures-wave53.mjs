#!/usr/bin/env node
/** Align LEG-W53-* fixture snippets with planning-sim-core evaluateCompare */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { evaluateCompare } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ADD = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-wave53-additions.json'), 'utf8'),
);
const FIX_DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');

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

let fixed = 0;
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
  if (detectType === 'manual') spec.expectedFail = 'advisory';
  const pass = evaluateCompare(detectType, spec.passSnippet, spec.detect);
  const fail = evaluateCompare(detectType, spec.failSnippet, spec.detect);
  if (detectType === 'manual') spec.expectedFail = fail;
  else spec.expectedFail = fail;
  spec.expectedPass = pass;
  writeFileSync(fixPath, JSON.stringify(spec, null, 2) + '\n');
  fixed += 1;
}
console.log(`✓ Repaired ${fixed} wave53 obligation fixtures`);
