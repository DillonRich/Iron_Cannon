#!/usr/bin/env node
/** Merge wave30 obligations + generate L4 specimens + compliance fixtures */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const IDX_PATH = join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json');
const ADD_PATH = join(ROOT, 'docs/engine/specimens/obligation-wave30-additions.json');
const L4_DIR = join(ROOT, 'docs/engine/specimens/layer4');
const FIX_DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');

const idx = JSON.parse(readFileSync(IDX_PATH, 'utf8'));
const add = JSON.parse(readFileSync(ADD_PATH, 'utf8'));
const existing = new Set(idx.obligations.map((o) => o.id));

for (const ob of add.obligations) {
  if (existing.has(ob.id)) continue;
  idx.obligations.push(ob);
  existing.add(ob.id);
}

idx.marketBundles.ca = idx.marketBundles.ca ?? ['LEG-PRIV-*', 'LEG-A11Y-*'];
idx.marketBundles.au = idx.marketBundles.au ?? ['LEG-PRIV-*', 'LEG-A11Y-*'];
idx.marketBundles.br = idx.marketBundles.br ?? ['LEG-PRIV-*'];
idx.marketBundles.in = idx.marketBundles.in ?? ['LEG-PRIV-*'];

writeFileSync(IDX_PATH, JSON.stringify(idx, null, 2) + '\n');

function slug(id) {
  return id.toLowerCase().replace(/_/g, '-');
}

function defaultPassSnippet(ob) {
  const t = ob.detect?.type ?? 'pattern';
  if (t === 'route_link') return `<Link href="${ob.detect.hrefContains ?? '/privacy'}">ok</Link>`;
  if (t === 'route_exists') return `export default function Page() { return <main>${ob.detect.path}</main> }`;
  if (t === 'schema_table' || t === 'schema_column') return `-- schema ok for ${ob.id}`;
  if (t === 'config') return 'verifiedDomain webhooks deliveryEvents configured';
  if (t === 'header') return `X-Iron-Cannon-Legal-Disclaimer: ${ob.detect.name ?? '1'}`;
  if (t === 'manual') return 'manualReviewCompleted=true';
  if (t === 'pattern') return (ob.detect.patterns ?? ['ok']).map((p) => p).join(' ');
  if (t === 'ui_pattern') return ob.detect.pattern ?? 'ok';
  if (t === 'flow_ref') return `flowId:${ob.detect.flowId}`;
  if (t === 'template_scan') return `template ${ob.detect.templateIdPrefix ?? 'txn_'}_ok`;
  if (t === 'script_before_consent') return 'consent then analytics blocked';
  return `/* pass ${ob.id} */`;
}

function defaultFailSnippet(ob) {
  const t = ob.detect?.type ?? 'pattern';
  if (t === 'ui_pattern') return 'defaultChecked={true}';
  if (t === 'route_link') return '<form>no link</form>';
  if (t === 'manual') return 'pending review';
  if (t === 'header') return 'no disclaimer header';
  if (t === 'script_before_consent') return 'analytics.load()';
  if (t === 'template_scan') return 'no address here';
  if (t === 'config') return 'unconfigured';
  return `/* gap ${ob.id} */`;
}

mkdirSync(L4_DIR, { recursive: true });
mkdirSync(FIX_DIR, { recursive: true });

let created = 0;
for (const ob of add.obligations) {
  const l4Path = join(L4_DIR, `obligation-${ob.id}.specimen.json`);
  if (!existsSync(l4Path)) {
    writeFileSync(
      l4Path,
      JSON.stringify(
        {
          $schema: 'https://ironcannon.dev/schemas/rule-fragment/v1',
          id: `layer4/obligation/${slug(ob.id)}`,
          layer: 4,
          rulesetVersion: '2026.06.03',
          flowId: ob.category === 'billing' ? 'billing-subscription' : 'auth-lifecycle',
          section: slug(ob.id),
          content: {
            requirement: ob.title,
            obligations: [ob.id],
            compareSteps: [
              `Run detect.type=${ob.detect?.type ?? 'pattern'}`,
              `Map result to obligation ${ob.id}`,
              'Attach legalDisclaimer on T12–T14',
            ],
            remediationDirective: `Remediate ${ob.id}: ${ob.title}`,
          },
          references: ob.sourceRefId ? [ob.sourceRefId] : [],
          compliancePatterns: {
            required: [{ id: ob.id, type: ob.detect?.type ?? 'pattern', tier: 'ironclad' }],
          },
          metadata: { minTier: 'ironclad', category: ob.category, disclaimerRequired: true },
        },
        null,
        2,
      ) + '\n',
    );
    created++;
  }

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
          passSnippet: defaultPassSnippet(ob),
          failSnippet: defaultFailSnippet(ob),
          expectedPass: 'met',
          expectedFail: 'gap',
        },
        null,
        2,
      ) + '\n',
    );
  }
}

console.log(`✓ Obligations index — ${idx.obligations.length} total (+${add.obligations.length} wave30)`);
console.log(`✓ L4 specimens created: ${created}`);
