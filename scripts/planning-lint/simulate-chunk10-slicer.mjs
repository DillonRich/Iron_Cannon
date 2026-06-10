#!/usr/bin/env node
/** Chunk 10 — C14 context slicer harness */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/slicer');

const BUDGET = {
  wiremap_summary: 8000,
  module_directive: 16000,
  security_surface: 12000,
  compliance_result: 4000,
  audit_checklist: 10000,
  security_directive: 12000,
  compliance_directive: 12000,
  legal_readiness: 10000,
};

const NEVER_TRUNCATE_KEYS = new Set([
  'acceptanceCriteria',
  'implementationConstraints',
  'compliancePatterns',
  'disclaimer',
  'legalDisclaimer',
  'correctionDirectives',
]);

function len(payload) {
  return JSON.stringify(payload).length;
}

function slicePayload(profile, payload) {
  const budget = BUDGET[profile] ?? 16000;
  if (len(payload) <= budget) return { payload, truncated: false, warningFlags: [] };

  const out = structuredClone(payload);
  const warnings = ['SLICE_TRUNCATED'];

  if (out.references) {
    out.references = out.references.map((r) => ({ refId: r.refId ?? r }));
  }
  if (out.content?.codeExamples) {
    out.content.codeExamples = out.content.codeExamples.map((ex) => ({
      ...ex,
      body: typeof ex.body === 'string' ? ex.body.slice(0, 200) : ex.body,
    }));
  }
  if (typeof out.content?.codeExamples?.[0]?.body === 'string') {
    out.content.codeExamples[0].body = out.content.codeExamples[0].body.replace(
      /LONG_PLACEHOLDER_REPEAT_\d+_CHARS/,
      '…',
    );
  }

  if (len(out) > budget) {
    const minimal = {};
    for (const k of Object.keys(out)) {
      if (NEVER_TRUNCATE_KEYS.has(k)) minimal[k] = out[k];
    }
    minimal.moduleId = out.moduleId;
    minimal.meta = { sliceOverflow: true, profile };
    return { payload: minimal, truncated: true, warningFlags: warnings };
  }
  return { payload: out, truncated: true, warningFlags: warnings };
}

const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'));
const failures = [];

for (const file of files) {
  const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
  const payload = structuredClone(spec.input.payload);
  if (spec.fixtureId === 'SL-02' && payload.content?.codeExamples?.[0]) {
    payload.content.codeExamples[0].body = 'x'.repeat(20000);
  }
  const result = slicePayload(spec.input.profile, payload);
  const e = spec.expected;
  const errs = [];

  if (e.truncated !== undefined && result.truncated !== e.truncated) errs.push('truncated mismatch');
  if (e.warningFlags) {
    for (const w of e.warningFlags) {
      if (!result.warningFlags.includes(w)) errs.push(`missing ${w}`);
    }
  }
  if (e.mustRetain) {
    for (const k of e.mustRetain) {
      if (result.payload[k] === undefined) errs.push(`dropped ${k}`);
    }
  }

  if (spec.input.scaleProfile) {
    const sp = spec.input.scaleProfile;
    if (!sp.tool || !sp.maxOutboundTokens || sp.ragTopK === undefined) {
      errs.push('scaleProfile missing tool/maxOutboundTokens/ragTopK');
    }
    const budget = BUDGET[spec.input.profile] ?? 16000;
    if (sp.maxOutboundTokens < budget) {
      errs.push(`scaleProfile.maxOutboundTokens ${sp.maxOutboundTokens} < slice budget ${budget}`);
    }
  }

  if (errs.length) failures.push(`${spec.fixtureId}: ${errs.join('; ')}`);
  else console.log(`✓ ${spec.fixtureId}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Chunk 10 C14 slicer — ${files.length} fixtures OK`);
process.exit(0);
