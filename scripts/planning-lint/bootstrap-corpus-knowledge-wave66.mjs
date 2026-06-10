#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['nextjs', 'middleware-auth-guard', 'Protect /app and /api routes with Next.js middleware session check'],
  ['nextjs', 'server-action-zod', 'Validate Server Action inputs with Zod before mutations'],
  ['owasp', 'xss-output-encode', 'Encode dynamic HTML output to prevent reflected XSS'],
  ['owasp', 'hsts-preload-apex', 'Set Strict-Transport-Security with preload on production apex domain'],
  ['owasp', 'rest-api-rate-limit', 'Rate limit REST endpoints per authenticated user or API key'],
  ['ironcannon', 'tgs-v2-obligation-floor', 'TGS v2 triggered at 120+ obligations; golden path unchanged'],
  ['ironcannon', 't05-verify-mandate', 'Run verify_module_compliance before get_module_directives next module'],
  ['ironcannon', 'layer4-disclaimer', 'IronClad compare responses must include legal disclaimer block'],
  ['cloudflare', 'hsts-transform-rule', 'Apply HSTS response header via Cloudflare Transform Rules on apex'],
  ['legal', 'connect-scope-out-of-bounds', 'Stripe Connect is out of TGS v1 scope; use SD-01 billing path only'],
];

mkdirSync(REF, { recursive: true });
const existingRef = new Set();
for (const f of readdirSync(REF)) {
  if (!f.endsWith('.specimen.json')) continue;
  const c = JSON.parse(readFileSync(join(REF, f), 'utf8'));
  if (c.refId) existingRef.add(c.refId);
}

let added = 0;
for (const [provider, slug, excerpt] of MICRO) {
  const refId = `${provider}/knowledge-w66-${slug}`;
  if (existingRef.has(refId)) continue;
  writeFileSync(
    join(REF, `${provider}-knowledge-w66-${slug}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w66/${slug}`,
        lastVerified: '2026-06-06',
        title: `W66 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave66 tgs-v2`,
        tags: ['wave66', 'knowledge', provider, 'tgs-v2'],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}

// Close last missing obligation ref (Connect out of scope)
const connectRef = 'stripe/connect-scope';
if (!existingRef.has(connectRef)) {
  writeFileSync(
    join(REF, 'stripe-connect-scope.specimen.json'),
    JSON.stringify(
      {
        refId: connectRef,
        sourceUrl: 'https://ironcannon.dev/planning/out-of-scope/connect',
        lastVerified: '2026-06-06',
        title: 'Stripe Connect (out of TGS v1 scope)',
        provider: 'stripe',
        excerpt:
          'Stripe Connect platform flows are Phase 4 / out of TGS v1. Golden path uses direct Stripe billing on SD-01.',
        embeddingHint: 'stripe connect out of scope tgs v1 phase4',
        tags: ['wave66', 'out-of-scope', 'stripe'],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}

console.log(`✓ Knowledge wave66 corpus — ${added} cards added`);
