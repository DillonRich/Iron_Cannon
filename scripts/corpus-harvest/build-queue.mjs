#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';
import { refIdFromUrl, specimenFilename } from './lib/ref-id.mjs';

function loadExistingRefIds() {
  const ids = new Set();
  if (!existsSync(PATHS.references)) return ids;
  for (const f of readdirSync(PATHS.references)) {
    if (!f.endsWith('.specimen.json')) continue;
    try {
      const card = JSON.parse(readFileSync(join(PATHS.references, f), 'utf8'));
      if (card.refId) ids.add(card.refId);
    } catch {
      /* skip */
    }
  }
  return ids;
}

function loadRules(provider) {
  const p = join(PATHS.priorityRules, `${provider}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
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

const existing = loadExistingRefIds();
const targetScale = process.argv.includes('--scale-c')
  ? 3000
  : process.argv.includes('--scale-b')
    ? 1000
    : process.argv.includes('--scale-a')
      ? 500
      : null;
const items = [];

for (const file of readdirSync(PATHS.inventory).filter((f) => f.endsWith('.json') && !f.startsWith('_'))) {
  const { links, synced } = JSON.parse(readFileSync(join(PATHS.inventory, file), 'utf8'));
  const provider = file.replace('.json', '');
  const rules = loadRules(provider);
  if (!rules) continue;

  for (const link of links) {
    if (/llms\.txt|llms-full\.txt|\/samples/i.test(link.url)) continue;
    const refId = refIdFromUrl(link.url, provider);
    if (existing.has(refId)) continue;
    const score = scoreLink(link, rules);
    if (score < 0) continue;
    items.push({
      refId,
      url: link.url,
      title: link.title,
      provider,
      priority: score >= 2 ? 'P0' : 'P1',
      appliesTo: rules.appliesToDefault ?? [],
      specimenFile: specimenFilename(refId),
    });
  }
}

const providerOrder =
  targetScale === 3000
    ? { cloudflare: 0, resend: 1, nextjs: 2, owasp: 3, legal: 4, stripe: 5 }
    : { stripe: 0, resend: 1, nextjs: 2, cloudflare: 3 };
items.sort((a, b) => {
  const po = (providerOrder[a.provider] ?? 9) - (providerOrder[b.provider] ?? 9);
  if (po !== 0) return po;
  return (a.priority === 'P0' ? -1 : 1) - (b.priority === 'P0' ? -1 : 1);
});

let capped = items;
if (targetScale) {
  const need = Math.max(0, targetScale - existing.size);
  capped = items.slice(0, need);
}

mkdirSync(join(PATHS.root, 'harvest-data'), { recursive: true });
writeFileSync(
  PATHS.queue,
  JSON.stringify(
    {
      built: new Date().toISOString(),
      existingCards: existing.size,
      targetScale: targetScale,
      targetScaleA: targetScale === 500 ? 500 : undefined,
      targetScaleB: targetScale === 1000 ? 1000 : undefined,
      targetScaleC: targetScale === 3000 ? 3000 : undefined,
      queued: capped.length,
      items: capped,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(`✓ Harvest queue — ${capped.length} new URLs (${existing.size} cards already published)`);
