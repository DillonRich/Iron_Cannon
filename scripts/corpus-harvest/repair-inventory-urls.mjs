#!/usr/bin/env node
/** Fix known malformed llms.txt URLs before balance queue build */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PATHS } from './lib/paths.mjs';

const FIXES = [
  [/analytics-engineindex\.md$/i, 'analytics/analytics-engine/index.md'],
  [/hyperdriveindex\.md$/i, 'hyperdrive/index.md'],
  [/vectorizeindex\.md$/i, 'vectorize/index.md'],
  [/d1index\.md$/i, 'd1/index.md'],
];

function repairUrl(url) {
  try {
    const u = new URL(url);
    for (const [pat, repl] of FIXES) {
      if (pat.test(u.pathname)) {
        u.pathname = `/${repl}`;
        return u.toString();
      }
    }
  } catch {
    return url;
  }
  return url;
}

let fixed = 0;
for (const file of ['cloudflare.json', 'resend.json', 'nextjs.json', 'stripe.json']) {
  const path = join(PATHS.inventory, file);
  const inv = JSON.parse(readFileSync(path, 'utf8'));
  for (const link of inv.links ?? []) {
    const next = repairUrl(link.url);
    if (next !== link.url) {
      link.url = next;
      fixed += 1;
    }
  }
  writeFileSync(path, JSON.stringify(inv, null, 2) + '\n', 'utf8');
}
console.log(`✓ Inventory URL repair — ${fixed} links fixed`);
