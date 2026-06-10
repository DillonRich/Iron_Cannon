#!/usr/bin/env node
/**
 * Iron Cannon corpus harvest CLI — scales to 10k via batched runs + resume state.
 *
 * Scale-A example (220 → 500):
 *   node scripts/corpus-harvest/corpus-harvest.mjs scale-a
 *
 * Full pipeline stage:
 *   node scripts/corpus-harvest/corpus-harvest.mjs sync|queue|fetch|publish|coverage|all
 */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const node = process.execPath;

function run(script, extraArgs = []) {
  const scriptPath =
    script.includes('planning-lint') || script.includes('corpus-harvest')
      ? script
      : join(__dirname, script);
  const r = spawnSync(node, [scriptPath, ...extraArgs], {
    stdio: 'inherit',
    cwd: join(__dirname, '../..'),
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const stage = process.argv[2] ?? 'help';

if (stage === 'help') {
  console.log(`
Iron Cannon corpus harvest

  scale-a     Sync → queue (to 500) → fetch 280 → publish → rebuild index → lint
  scale-c     Sync → queue (to 3000) → fetch batch → publish → rebuild index
  sync        Fetch llms.txt registries
  queue       Build harvest-queue.json (--scale-a for 500 target)
  fetch       Fetch pages (--limit=N --resume)
  publish     Copy drafts → specimens (--auto-only --max=N)
  coverage    Emit corpus-coverage.json
  all         sync + queue + fetch --limit=50 + coverage

Env (Vectorize only): CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
`);
  process.exit(0);
}

if (stage === 'scale-a') {
  console.log('=== Scale-A harvest (target 500 cards) ===\n');
  run('sync-registries.mjs');
  run('build-queue.mjs', ['--scale-a']);
  run('fetch-docs.mjs', ['--limit=300', '--resume']);
  run('publish-drafts.mjs', ['--max=300']);
  run('emit-coverage.mjs');
  run(join(__dirname, '../planning-lint/build-reference-index.mjs'));
  console.log('\nRun: npm run lint:all');
  console.log('Then: node scripts/corpus-harvest/vectorize-reindex.mjs (requires Cloudflare)');
  process.exit(0);
}

if (stage === 'scale-b') {
  console.log('=== Scale-B harvest (target 1000 cards) ===\n');
  run('sync-registries.mjs');
  run('build-queue.mjs', ['--scale-b']);
  run('merge-scale-b-seeds.mjs');
  run('fetch-docs.mjs', ['--limit=400', '--resume']);
  run('publish-drafts.mjs', ['--max=450']);
  run('emit-coverage.mjs');
  run(join(__dirname, '../planning-lint/build-reference-index.mjs'));
  console.log('\nRun: npm run planning:regression && npm run lint:all');
  console.log('Gate: node scripts/planning-lint/validate-corpus-scale.mjs --tier=b');
  process.exit(0);
}

if (stage === 'scale-c') {
  const fetchLimit = process.env.HARVEST_FETCH_LIMIT ?? '500';
  const publishMax = process.env.HARVEST_PUBLISH_MAX ?? '500';
  console.log(`=== Scale-C harvest (target 3000 cards, batch fetch=${fetchLimit}) ===\n`);
  run('sync-registries.mjs');
  run('build-queue.mjs', ['--scale-c']);
  run('merge-scale-b-seeds.mjs');
  run('build-queue-stripe-owasp-boost.mjs');
  run('fetch-docs.mjs', [`--limit=${fetchLimit}`, '--resume']);
  run('publish-drafts.mjs', [`--max=${publishMax}`]);
  run('emit-coverage.mjs');
  run(join(__dirname, '../planning-lint/build-reference-index.mjs'));
  console.log('\nRun: npm run planning:regression && npm run lint:all');
  console.log('Repeat scale-c until corpus-coverage scaleC.gap === 0');
  process.exit(0);
}

if (stage === 'sync') run('sync-registries.mjs');
else if (stage === 'queue') run('build-queue.mjs', process.argv.slice(3));
else if (stage === 'fetch') run('fetch-docs.mjs', process.argv.slice(3));
else if (stage === 'publish') run('publish-drafts.mjs', process.argv.slice(3));
else if (stage === 'coverage') run('emit-coverage.mjs');
else if (stage === 'all') {
  run('sync-registries.mjs');
  run('build-queue.mjs');
  run('fetch-docs.mjs', ['--limit=50']);
  run('emit-coverage.mjs');
} else {
  console.error(`Unknown stage: ${stage}`);
  process.exit(1);
}
