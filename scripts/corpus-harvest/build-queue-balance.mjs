#!/usr/bin/env node
/** Queue P0 docs from underrepresented providers (resend, nextjs, cloudflare) — corpus quality pass */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PATHS } from './lib/paths.mjs';
import { refIdFromUrl, specimenFilename } from './lib/ref-id.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '120');
const BALANCE_PROVIDERS = ['resend', 'nextjs', 'cloudflare'];

function loadRules(provider) {
  return JSON.parse(readFileSync(join(PATHS.priorityRules, `${provider}.json`), 'utf8'));
}

function scoreLink(link, rules) {
  const path = new URL(link.url).pathname.toLowerCase();
  for (const ex of rules.excludePatterns ?? []) {
    if (path.includes(ex.toLowerCase())) return -1;
  }
  for (const inc of rules.includePatterns ?? []) {
    if (path.includes(inc.toLowerCase())) return 2;
  }
  return 0;
}

const existing = new Set();
for (const f of readdirSync(PATHS.references)) {
  if (!f.endsWith('.specimen.json')) continue;
  const c = JSON.parse(readFileSync(join(PATHS.references, f), 'utf8'));
  if (c.refId) existing.add(c.refId);
}

const items = [];
for (const provider of BALANCE_PROVIDERS) {
  const invPath = join(PATHS.inventory, `${provider}.json`);
  if (!existsSync(invPath)) continue;
  const { links } = JSON.parse(readFileSync(invPath, 'utf8'));
  const rules = loadRules(provider);
  for (const link of links) {
    if (/llms\.txt|llms-full|\/samples|pnpm-lock|package\.json|\.ya?ml$/i.test(link.url)) continue;
    if (/engineindex\.md|driveindex\.md/i.test(link.url)) continue;
    const refId = refIdFromUrl(link.url, provider);
    if (existing.has(refId)) continue;
    if (scoreLink(link, rules) < 0) continue;
    items.push({
      refId,
      url: link.url,
      title: link.title,
      provider,
      priority: 'P0',
      appliesTo: rules.appliesToDefault ?? [],
      specimenFile: specimenFilename(refId),
    });
  }
}

items.sort((a, b) => (a.provider === 'resend' ? -1 : a.provider === 'nextjs' ? 0 : 1));
const capped = items.slice(0, limit);

mkdirSync(join(ROOT, 'harvest-data'), { recursive: true });
writeFileSync(
  PATHS.queue,
  JSON.stringify(
    { built: new Date().toISOString(), mode: 'balance', queued: capped.length, items: capped },
    null,
    2,
  ) + '\n',
  'utf8',
);
console.log(`✓ Balance queue — ${capped.length} URLs (resend/nextjs/cloudflare)`);
