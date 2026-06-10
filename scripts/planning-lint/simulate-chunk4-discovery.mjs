#!/usr/bin/env node
/**
 * Planning-phase T01 harness — validates Chunk 4 discovery logic against SD fixtures.
 * Mirrors packages/local-cli/src/discover/scanner.ts (not production copy).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_DIR = join(ROOT, 'docs/engine/specimens/fixtures/stack-detection');

function readText(root, rel) {
  try {
    return readFileSync(join(root, rel), 'utf8');
  } catch {
    return null;
  }
}

function readJson(root, rel) {
  const t = readText(root, rel);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function detectConflicts(input) {
  const out = [];
  if (input.hasVercel && input.hasWrangler) {
    out.push({ id: 'hybrid-host:vercel+cloudflare-d1' });
  }
  if (input.deps?.['@supabase/supabase-js'] && input.hasWrangler) {
    out.push({ id: 'C01' });
  }
  return out;
}

/** Chunk 4 §8 scanner (planning mirror) */
function analyzeProjectStack(projectRoot) {
  const pkg = readJson(projectRoot, 'package.json');
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };

  let frontend = 'unknown';
  if (deps?.next) frontend = 'nextjs';
  else if (deps?.vite || deps?.['@vitejs/plugin-react']) frontend = 'vite_react';

  const hasWrangler =
    existsSync(join(projectRoot, 'wrangler.toml')) ||
    existsSync(join(projectRoot, 'wrangler.jsonc')) ||
    existsSync(join(projectRoot, 'wrangler.pages.toml'));
  const hasVercel = existsSync(join(projectRoot, 'vercel.json'));

  let compute = 'unknown';
  if (hasWrangler) compute = 'cloudflare_workers';
  if (hasVercel && !hasWrangler) compute = 'vercel';

  let database = 'unknown';
  const wranglerParts = ['wrangler.toml', 'wrangler.jsonc', 'wrangler.pages.toml'].map((f) =>
    readText(projectRoot, f),
  );
  const wranglerText = wranglerParts.filter(Boolean).join('\n');
  const hasWorkerMain = /\bmain\s*=/.test(wranglerText);
  const hasPagesBuild = wranglerText.includes('pages_build_output_dir');
  const hasSupabase = Boolean(deps?.['@supabase/supabase-js'] || deps?.['@supabase/ssr']);
  if (wranglerText.includes('d1_databases')) database = 'cloudflare_d1';
  else if (hasSupabase && !hasWrangler) database = 'supabase_postgres';

  const services = [];
  if (deps?.stripe || deps?.['@stripe/stripe-js']) services.push('stripe');
  if (deps?.resend) services.push('resend');
  if (hasSupabase) services.push('supabase_auth');

  const envExample = readText(projectRoot, '.env.example') ?? '';
  const envVarNames = envExample
    .split('\n')
    .map((l) => l.split('=')[0]?.trim())
    .filter(Boolean);

  const warnings = [];
  const hasExternalServer = existsSync(join(projectRoot, 'server/index.js'));
  if (hasVercel && hasWrangler) warnings.push('HYBRID_STACK_DETECTED');
  if (hasPagesBuild && hasExternalServer) {
    warnings.push('HYBRID_STACK_DETECTED', 'external-api-surface');
  } else if (hasPagesBuild && hasWorkerMain) {
    warnings.push('HYBRID_STACK_DETECTED', 'pages-worker-split');
  } else if (hasPagesBuild) {
    warnings.push('HYBRID_STACK_DETECTED', 'external-api-surface');
  }
  if (hasExternalServer) warnings.push('external-api-surface');
  if (deps?.firebase) warnings.push('UNSUPPORTED_PRIMARY:firebase');
  if (hasSupabase) warnings.push('SUPABASE_PRIMARY');

  const conflicts = detectConflicts({ hasWrangler, hasVercel, deps, envVarNames, projectRoot });
  if (hasSupabase && hasWrangler && database === 'cloudflare_d1') {
    conflicts.push({ id: 'C01' });
    warnings.push('dual-database');
  }
  const missingConfig = [];
  if (services.includes('stripe') && !envVarNames.includes('STRIPE_WEBHOOK_SECRET')) {
    missingConfig.push('STRIPE_WEBHOOK_SECRET');
  }
  if (hasSupabase) {
    if (!envVarNames.includes('NEXT_PUBLIC_SUPABASE_URL')) missingConfig.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!envVarNames.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      missingConfig.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  }
  if (warnings.includes('external-api-surface')) {
    missingConfig.push('worker-routes-or-pages-functions');
  }

  const supported =
    frontend !== 'unknown' &&
    !deps?.firebase &&
    conflicts.length === 0 &&
    (compute !== 'unknown' || services.length > 0 || database === 'supabase_postgres');

  return { frontend, compute, database, services, conflicts, missingConfig, warnings, supported };
}

function materializeFixture(spec) {
  const dir = mkdtempSync(join(tmpdir(), 'ic-sd-'));
  for (const f of spec.projectFiles ?? []) {
    const full = join(dir, f.path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, f.content, 'utf8');
  }
  return dir;
}

function assertT01(fixtureId, actual, expected) {
  const errors = [];
  if (expected.supported !== undefined && actual.supported !== expected.supported) {
    errors.push(`supported: got ${actual.supported}, want ${expected.supported}`);
  }
  if (expected.conflicts?.length) {
    const ids = actual.conflicts.map((c) => c.id);
    for (const want of expected.conflicts) {
      if (!ids.some((id) => id.includes(want) || want.includes(id))) {
        errors.push(`conflicts: missing "${want}" in [${ids.join(', ')}]`);
      }
    }
  }
  if (expected.warnings?.length) {
    for (const w of expected.warnings) {
      if (!actual.warnings.includes(w)) errors.push(`warnings: missing "${w}"`);
    }
  }
  return errors;
}

const files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.fixture-spec.json'));
const failures = [];

for (const file of files) {
  const spec = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
  const root = materializeFixture(spec);
  try {
    const actual = analyzeProjectStack(root);
    const errs = assertT01(spec.fixtureId ?? file, actual, spec.expectedT01 ?? {});
    if (spec.expectedT02) {
      const complete =
        actual.supported !== false && (actual.missingConfig?.length ?? 0) === 0;
      if (spec.expectedT02.complete === true && !complete) errs.push('T02: expected complete stack');
      if (spec.expectedT02.complete === false && complete) errs.push('T02: expected incomplete stack');
      if (spec.expectedT02.missingConfig) {
        for (const m of spec.expectedT02.missingConfig) {
          if (!actual.missingConfig?.includes(m)) errs.push(`T02: missing ${m}`);
        }
      }
      if (spec.expectedT02.errorCode === 'STACK_UNSUPPORTED' && actual.supported) {
        errs.push('T02: expected STACK_UNSUPPORTED (supported must be false)');
      }
    }
    if (errs.length) failures.push(`${spec.fixtureId ?? file}: ${errs.join('; ')}`);
    else {
      const tag = spec.expectedT02 ? 'T01+T02' : 'T01';
      console.log(`✓ ${spec.fixtureId ?? file} ${tag}`);
    }
  } finally {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

if (failures.length) {
  console.error('Chunk 4 discovery simulation failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`✓ Chunk 4 T01 discovery — ${files.length} stack-detection fixtures OK`);
process.exit(0);
