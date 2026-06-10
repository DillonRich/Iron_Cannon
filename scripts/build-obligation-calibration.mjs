#!/usr/bin/env node
/**
 * Build obligation calibration bundle (pass/fail snippets per LEG-*).
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readEngineJson } from '../packages/mcp-core/src/engine-data.js';
import { evaluateCompare } from '../scripts/planning-lint/lib/planning-sim-core.mjs';
import {
  passSnippetForObligation,
  failSnippetForObligation,
} from './lib/obligation-calibration-snippets.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/engine/specimens/fixtures/obligation-calibration/calibration.bundle.json');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/compliance/obligations');

function loadFixtureSpec(id) {
  const p = join(FIXTURE_DIR, `${id}.fixture-spec.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function snippetsForObligation(o) {
  if (o.detect?.type === 'manual') return { skip: true };
  const fx = loadFixtureSpec(o.id);
  if (fx?.passSnippet) {
    return { passSnippet: fx.passSnippet, failSnippet: fx.failSnippet ?? `gap ${o.id}` };
  }
  return {
    passSnippet: passSnippetForObligation(o),
    failSnippet: failSnippetForObligation(o),
  };
}

const idx = readEngineJson('specimens/obligation-index.specimen.json');
const entries = [];
let tuned = 0;
for (const o of idx.obligations) {
  const sn = snippetsForObligation(o);
  if (sn.skip) continue;
  const detect = o.detect ?? { type: 'pattern' };
  let passSnippet = sn.passSnippet;
  let failSnippet = sn.failSnippet;
  const passStatus = evaluateCompare(detect.type, passSnippet, detect);
  const failStatus = evaluateCompare(detect.type, failSnippet, detect);
  if (passStatus !== 'met' || failStatus === 'met') {
    passSnippet = passSnippetForObligation(o);
    failSnippet = failSnippetForObligation(o);
    tuned += 1;
  }
  entries.push({
    obligationId: o.id,
    detectType: detect.type,
    passSnippet,
    failSnippet,
  });
}

const bundle = {
  rulesetVersion: idx.version ?? '2026.06.05',
  count: entries.length,
  entries,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(bundle, null, 2) + '\n');
console.log(
  `✓ obligation calibration bundle — ${entries.length} entries (${tuned} auto-tuned) → ${OUT}`,
);
