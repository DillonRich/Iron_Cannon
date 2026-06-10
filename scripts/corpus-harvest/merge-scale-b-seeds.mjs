#!/usr/bin/env node
/** Merge scale-b-seed-urls + OWASP cheatsheet index into harvest queue items */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from './lib/paths.mjs';
import { refIdFromUrl, specimenFilename } from './lib/ref-id.mjs';

const seeds = JSON.parse(
  readFileSync(join(PATHS.root, 'docs/engine/planning/scale-b-seed-urls.json'), 'utf8'),
);

function loadExistingRefIds() {
  const ids = new Set();
  if (!existsSync(PATHS.references)) return ids;
  for (const f of readdirSync(PATHS.references).filter((x) => x.endsWith('.specimen.json'))) {
    try {
      const card = JSON.parse(readFileSync(join(PATHS.references, f), 'utf8'));
      if (card.refId) ids.add(card.refId);
    } catch {
      /* skip */
    }
  }
  return ids;
}

async function owaspCheatsheetLinks() {
  const res = await fetch('https://cheatsheetseries.owasp.org/index.html', {
    headers: { 'User-Agent': 'IronCannon-CorpusHarvest/1.0' },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const links = [];
  const re = /href="(\/cheatsheets\/[^"]+\.html)"/g;
  let m;
  while ((m = re.exec(html))) {
    const path = m[1];
    links.push({
      url: `https://cheatsheetseries.owasp.org${path}`,
      title: path.replace(/.*\//, '').replace('.html', '').replace(/_/g, ' '),
      provider: 'owasp',
    });
  }
  return links;
}

const existing = loadExistingRefIds();
const extra = [];

for (const seed of seeds.seeds ?? []) {
  const refId = refIdFromUrl(seed.url, seed.provider);
  if (existing.has(refId)) continue;
  extra.push({
    refId,
    url: seed.url,
    title: seed.topic ?? refId,
    provider: seed.provider,
    priority: 'P0',
    appliesTo: ['security', 'compliance'],
    specimenFile: specimenFilename(refId),
    source: 'scale-b-seed',
  });
}

try {
  const owasp = await owaspCheatsheetLinks();
  for (const link of owasp.slice(0, 60)) {
    const refId = refIdFromUrl(link.url, 'owasp');
    if (existing.has(refId)) continue;
    extra.push({
      refId,
      url: link.url,
      title: link.title,
      provider: 'owasp',
      priority: 'P0',
      appliesTo: ['security'],
      specimenFile: specimenFilename(refId),
      source: 'owasp-index',
    });
  }
  console.log(
    `  owasp index: ${owasp.length} links, ${extra.filter((e) => e.source === 'owasp-index').length} new`,
  );
} catch (e) {
  console.warn(`  owasp index skip — ${e.message}`);
}

mkdirSync(join(PATHS.root, 'harvest-data'), { recursive: true });

let queue = { items: [] };
if (existsSync(PATHS.queue)) {
  queue = JSON.parse(readFileSync(PATHS.queue, 'utf8'));
}
const seen = new Set((queue.items ?? []).map((i) => i.refId));
let merged = 0;
for (const item of extra) {
  if (!seen.has(item.refId)) {
    queue.items.push(item);
    seen.add(item.refId);
    merged += 1;
  }
}
queue.mergedSeeds = merged;
queue.queued = queue.items.length;
writeFileSync(PATHS.queue, JSON.stringify(queue, null, 2) + '\n');
console.log(`✓ Scale-B seeds merged — +${merged} URLs (queue ${queue.items.length} total)`);
