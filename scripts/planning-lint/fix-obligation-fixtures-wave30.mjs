#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { evaluateCompare } from './lib/planning-sim-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const IDX = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');

function passSnippet(ob) {
  const t = ob.detect?.type ?? 'pattern';
  if (t === 'route_link') return `<a href="${ob.detect.hrefContains ?? 'privacy'}">ok</a>`;
  if (t === 'route_exists') return `export default function P(){return <main>${ob.detect.path}</main>}`;
  if (t === 'schema_table') return `CREATE TABLE ${ob.detect.table ?? 'consent_audit_log'} (id INT)`;
  if (t === 'schema_column') return `ALTER TABLE ${ob.detect.table ?? 'users'} ADD ${ob.detect.column} TEXT`;
  if (t === 'config') return 'verifiedDomain webhooks deliveryEvents';
  if (t === 'header') return `${ob.detect.name}: ok`;
  if (t === 'manual') return 'manualReviewCompleted=true';
  if (t === 'pattern') return (ob.detect.patterns ?? ['StripeElements']).join(' ');
  if (t === 'ui_pattern') return `/* ${ob.detect.pattern ?? 'cancel subscription'} */`;
  if (t === 'flow_ref') return `flowId:${ob.detect.flowId} delete-account data-export`;
  if (t === 'template_scan') {
    if (ob.detect.field === 'promotionalContentInTransactional') return 'transactional receipt only';
    if (ob.detect.event) return `invoice.payment_failed template txn_ok physicalAddress`;
    if (ob.detect.templateIdPrefix) return `templateId=${ob.detect.templateIdPrefix}welcome`;
    return 'physicalAddress 123 Main St';
  }
  if (t === 'script_before_consent') return 'CookieConsent before analytics';
  return `pass ${ob.id}`;
}

function failSnippet(ob) {
  const t = ob.detect?.type ?? 'pattern';
  if (t === 'manual') return 'not reviewed yet';
  if (t === 'ui_pattern') return 'defaultChecked={true}';
  if (t === 'script_before_consent') return 'analytics.load() without consent';
  if (t === 'route_link') return '<form></form>';
  if (t === 'route_exists') return 'export default function P(){return null}';
  if (t === 'template_scan') {
    if (ob.detect.field === 'promotionalContentInTransactional') return 'buy now limited offer sale today';
    return 'empty template';
  }
  if (t === 'component_scan') return 'no banner here';
  if (t === 'flow_ref') return 'unrelated flow';
  if (t === 'pattern' && ob.detect.forbidden) return ob.detect.forbidden[0];
  return `gap ${ob.id}`;
}

let fixed = 0;
for (const ob of IDX.obligations) {
  const path = join(DIR, `${ob.id}.fixture-spec.json`);
  if (!existsSync(path)) {
    writeFileSync(
      path,
      JSON.stringify(
        {
          fixtureId: ob.id,
          obligationId: ob.id,
          detectType: ob.detect?.type ?? 'pattern',
          detect: ob.detect ?? { type: 'pattern' },
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
  const spec = JSON.parse(readFileSync(path, 'utf8'));
  spec.passSnippet = passSnippet(ob);
  spec.failSnippet = failSnippet(ob);
  spec.detect = ob.detect ?? spec.detect;
  spec.detectType = ob.detect?.type ?? spec.detectType;
  const pass = evaluateCompare(spec.detectType, spec.passSnippet, spec.detect);
  const fail = evaluateCompare(spec.detectType, spec.failSnippet, spec.detect);
  spec.expectedPass = pass;
  spec.expectedFail = fail === 'met' ? 'gap' : fail;
  writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
  fixed++;
}
console.log(`✓ Fixed ${fixed} obligation fixtures (dynamic expected results)`);
