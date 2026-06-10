#!/usr/bin/env node
/**
 * Forbidden stale phrases in docs/ (planning quality gate).
 */
import { readFileSync } from 'fs';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DOCS = join(ROOT, 'docs');

const FORBIDDEN = [
  { pattern: /\b11 MCP tools\b/i, reason: 'use 14 tools' },
  { pattern: /\ball 11 tools\b/i, reason: 'use 14 tools' },
  { pattern: /\b\(11 tools\)/i, reason: 'use 14 tools' },
];

const SKIP_PATH_PARTS = [
  'PLANNING_PHASE1_CHUNK4_MCP.md',
  'PLANNING_R10_GAP_FIXES.md',
  'PLANNING_PSYCHO_ANALYSIS.md',
  'PLANNING_QUALITY_GUARDRAILS.md',
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.md') || name.endsWith('.mdc')) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(DOCS)) {
  const rel = file.replace(ROOT + '/', '').replace(/\\/g, '/');
  if (SKIP_PATH_PARTS.some((s) => rel.includes(s))) continue;
  const text = readFileSync(file, 'utf8');
  for (const { pattern, reason } of FORBIDDEN) {
    if (pattern.test(text)) hits.push(`${rel}: ${reason} (${pattern})`);
  }
}

if (hits.length) {
  console.error('Doc drift lint failures:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('✓ Doc drift lint — no forbidden stale MCP tool counts');
process.exit(0);
