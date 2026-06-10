#!/usr/bin/env node
/** Prune low-value stripe URLs and fix known 404 patterns (wave 65) */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';

const DROP_PATTERNS = [
  /financial-connections/i,
  /revenue-recognition/i,
  /administrative-facilitation-fee/i,
  /netsuite/i,
  /climate\//i,
];

const URL_FIXES = [
  [/\.md\.md$/i, '.md'],
  [/index\.md\.md$/i, 'index.md'],
];

const invPath = join(PATHS.inventory, 'stripe.json');
const inv = JSON.parse(readFileSync(invPath, 'utf8'));
let dropped = 0;
let fixed = 0;

inv.links = (inv.links ?? []).filter((link) => {
  const drop = DROP_PATTERNS.some((p) => p.test(link.url));
  if (drop) dropped += 1;
  return !drop;
});

for (const link of inv.links) {
  let url = link.url;
  for (const [pat, repl] of URL_FIXES) {
    if (pat.test(url)) {
      url = url.replace(pat, repl);
    }
  }
  if (url !== link.url) {
    link.url = url;
    fixed += 1;
  }
}

writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n', 'utf8');
console.log(`✓ Stripe inventory wave65 — dropped ${dropped}, fixed ${fixed}, ${inv.links.length} links remain`);
