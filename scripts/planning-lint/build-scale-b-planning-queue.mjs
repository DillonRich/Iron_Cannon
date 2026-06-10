#!/usr/bin/env node
/** Scale-B planning queue (623→1000) — no fetch, SSOT for harvest when approved */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/reference-index.specimen.json'), 'utf8'),
);
const current = idx.cardCount ?? idx.entries?.length ?? 0;
const TARGET = 1000;
const delta = TARGET - current;

const PRIORITY_BATCHES = [
  { provider: 'legal', count: 25, topics: ['gdpr', 'can-spam', 'wcag', 'ccpa', 'cookie'] },
  { provider: 'owasp', count: 46, topics: ['asvs', 'cheatsheet', 'top10'] },
  { provider: 'cloudflare', count: 51, topics: ['workers', 'd1', 'kv', 'r2', 'zero-trust'] },
  { provider: 'nextjs', count: 36, topics: ['app-router', 'middleware', 'security'] },
  { provider: 'resend', count: 22, topics: ['webhooks', 'domains', 'templates'] },
  { provider: 'stripe', count: 14, topics: ['billing', 'tax', 'connect', 'radar'] },
  { provider: 'ironcannon', count: 17, topics: ['edge', 'tier', 'compose'] },
];

const queue = {
  $schema: 'https://ironcannon.dev/schemas/scale-b-harvest-queue/v1',
  rulesetVersion: '2026.06.03',
  currentCardCount: current,
  targetCardCount: TARGET,
  deltaRequired: delta,
  status: 'planning-only',
  batches: PRIORITY_BATCHES,
  procedure: [
    'npm run harvest:sync',
    'node scripts/corpus-harvest/build-queue.mjs',
    'node scripts/corpus-harvest/fetch-docs.mjs --limit=200 --resume',
    'node scripts/corpus-harvest/publish-drafts.mjs --max=200',
    'npm run planning:build-index',
    'npm run planning:regression',
    'npm run lint:all',
  ],
  gateBeforePromoteTierB: 'validate-corpus-scale.mjs --tier=b',
};

const out = join(ROOT, 'docs/engine/planning/scale-b-harvest-queue.json');
writeFileSync(out, JSON.stringify(queue, null, 2) + '\n');
console.log(`✓ Scale-B queue — ${current}→${TARGET} (${delta} planned)`);
