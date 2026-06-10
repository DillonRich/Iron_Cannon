#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { PATHS } from './lib/paths.mjs';
import { distillMarkdown, distillHtml } from './lib/distill.mjs';
import { loadState, saveState, isFetched, markFetched } from './lib/state.mjs';

function arg(name, def) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
}

const limit = Number(arg('limit', '50'));
const resume = process.argv.includes('--resume');

const registry = JSON.parse(readFileSync(PATHS.registry, 'utf8'));
const queue = JSON.parse(readFileSync(PATHS.queue, 'utf8'));
const state = loadState();

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchDoc(item) {
  const cfg = registry.providers[item.provider];
  const rate = cfg?.rateLimitMs ?? 1000;

  let url = item.url;
  if (item.provider === 'stripe' && !url.endsWith('.md') && !url.includes('?')) {
    url = url.replace(/\/?$/, '') + '.md';
  }

  const headers = { 'User-Agent': 'IronCannon-CorpusHarvest/1.0' };
  if (cfg?.fetchMode === 'cloudflare-markdown') {
    headers.Accept = 'text/markdown';
  }

  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  await sleep(rate);

  const mode = cfg?.fetchMode ?? 'html';
  const excerpt =
    mode === 'markdown' || mode === 'cloudflare-markdown'
      ? distillMarkdown(item.title, body)
      : distillHtml(item.title, body);

  const hash = createHash('sha256').update(body).digest('hex');
  const rawDir = join(PATHS.raw, item.provider);
  mkdirSync(rawDir, { recursive: true });
  const rawFile = join(rawDir, `${item.refId.replace(/\//g, '-')}.md`);
  writeFileSync(rawFile, body.slice(0, 500_000), 'utf8');

  const draft = {
    refId: item.refId,
    sourceUrl: item.url,
    lastVerified: new Date().toISOString().slice(0, 10),
    title: item.title.slice(0, 200),
    excerpt,
    appliesTo: item.appliesTo ?? [],
    tags: [item.provider, ...(item.priority === 'P0' ? ['p0'] : ['p1'])],
    harvestMeta: {
      rawSha256: hash,
      distilledAt: new Date().toISOString(),
      model: 'none',
      autoApproved: item.priority === 'P0',
    },
  };

  mkdirSync(PATHS.drafts, { recursive: true });
  const draftPath = join(PATHS.drafts, `${item.refId.replace(/\//g, '-')}.draft.json`);
  writeFileSync(draftPath, JSON.stringify(draft, null, 2) + '\n', 'utf8');
  markFetched(state, item.url, { refId: item.refId, hash });
  return draft;
}

let done = 0;
let errors = 0;

for (const item of queue.items) {
  if (done >= limit) break;
  if (resume && (isFetched(state, item.url) || state.deadUrls?.[item.url])) continue;
  if (existsSync(join(PATHS.references, item.specimenFile))) continue;

  try {
    await fetchDoc(item);
    done += 1;
    console.log(`  ✓ ${item.refId}`);
  } catch (e) {
    errors += 1;
    console.warn(`  ✗ ${item.refId}: ${e.message}`);
    if (!state.deadUrls) state.deadUrls = {};
    state.deadUrls[item.url] = { refId: item.refId, error: e.message, at: new Date().toISOString() };
  }
}

saveState(state);
console.log(`✓ Fetch — ${done} drafts, ${errors} errors (limit ${limit})`);
