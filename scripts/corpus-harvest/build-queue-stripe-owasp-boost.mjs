#!/usr/bin/env node
/** Append unpublished stripe + fresh owasp links to harvest queue (Scale-C balance) */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';
import { refIdFromUrl, specimenFilename } from './lib/ref-id.mjs';

function loadExisting() {
  const ids = new Set();
  for (const f of readdirSync(PATHS.references).filter((x) => x.endsWith('.specimen.json'))) {
    try {
      const c = JSON.parse(readFileSync(join(PATHS.references, f), 'utf8'));
      if (c.refId) ids.add(c.refId);
    } catch {
      /* skip */
    }
  }
  return ids;
}

function loadRules(provider) {
  const p = join(PATHS.priorityRules, `${provider}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}

const existing = loadExisting();
const extra = [];

for (const provider of ['stripe', 'resend']) {
  const invPath = join(PATHS.inventory, `${provider}.json`);
  if (!existsSync(invPath)) continue;
  const { links } = JSON.parse(readFileSync(invPath, 'utf8'));
  const rules = loadRules(provider);
  for (const link of links) {
    if (/llms\.txt|llms-full/i.test(link.url)) continue;
    const refId = refIdFromUrl(link.url, provider);
    if (existing.has(refId)) continue;
    extra.push({
      refId,
      url: link.url,
      title: link.title,
      provider,
      priority: 'P0',
      appliesTo: rules?.appliesToDefault ?? [],
      specimenFile: specimenFilename(refId),
      source: 'stripe-owasp-boost',
    });
  }
}

let queue = { items: [] };
if (existsSync(PATHS.queue)) {
  queue = JSON.parse(readFileSync(PATHS.queue, 'utf8'));
}
const seen = new Set(queue.items.map((i) => i.refId));
let merged = 0;
for (const item of extra.slice(0, 120)) {
  if (!seen.has(item.refId)) {
    queue.items.push(item);
    seen.add(item.refId);
    merged += 1;
  }
}
queue.boostMerged = merged;
queue.queued = queue.items.length;
mkdirSync(join(PATHS.root, 'harvest-data'), { recursive: true });
writeFileSync(PATHS.queue, JSON.stringify(queue, null, 2) + '\n');
console.log(`✓ Stripe/Resend boost — +${merged} URLs (queue ${queue.items.length})`);
