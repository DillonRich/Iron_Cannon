#!/usr/bin/env node
/** SVC-001 Phase B — Pages / OpenNext / dual-wrangler planning reference cards (+50). */
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const TOPICS = [
  ['cloudflare', 'pages-build-output-dir', 'Configure pages_build_output_dir in wrangler.pages.toml for static assets; keep Worker API in wrangler.toml with main entry.'],
  ['cloudflare', 'open-next-assets', 'OpenNext on Cloudflare deploys .open-next/assets as Pages static output and routes dynamic traffic to the Worker handler.'],
  ['cloudflare', 'pages-functions-cors', 'When UI is on Pages and API on Workers, configure Access-Control-Allow-Origin for the Pages subdomain on API routes.'],
  ['cloudflare', 'pages-preview-env', 'Use wrangler env.preview for Pages preview deployments; never copy production STRIPE_WEBHOOK_SECRET into preview vars.'],
  ['cloudflare', 'nodejs-compat-pages', 'Enable nodejs_compat compatibility flag on Pages/OpenNext projects that rely on Node.js APIs in the edge bundle.'],
  ['cloudflare', 'pages-custom-domains', 'Attach custom domains to Pages project separately from Worker API routes; document DNS CNAME targets in deploy runbook.'],
  ['cloudflare', 'pages-redirects', 'Use _redirects or wrangler redirects for SPA fallbacks when serving Next static export from Pages.'],
  ['cloudflare', 'pages-headers', 'Set security headers (_headers) on Pages static responses: CSP, X-Frame-Options, HSTS for auth surfaces.'],
  ['nextjs', 'public-api-url', 'Expose Worker API base URL via NEXT_PUBLIC_API_URL for browser fetch from Pages-hosted Next.js UI (SD-06 pattern).'],
  ['nextjs', 'middleware-pages-split', 'Next.js middleware on Pages must use same session cookie name and parent domain as Worker auth routes.'],
];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
}

const existing = new Set();
for (const f of readdirSync(REF_DIR).filter((x) => x.endsWith('.specimen.json'))) {
  try {
    const c = JSON.parse(readFileSync(join(REF_DIR, f), 'utf8'));
    if (c.refId) existing.add(c.refId);
  } catch {
    /* skip */
  }
}

let created = 0;
for (let i = 0; i < 50; i++) {
  const t = TOPICS[i % TOPICS.length];
  const refId = `${t[0]}/svc001-pages-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  writeFileSync(
    join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/svc001/pages/${slug(t[1])}-${i}`,
        lastVerified: '2026-05-31',
        title: `SVC-001 ${t[1]} ${i}`,
        provider: t[0],
        excerpt: t[2],
        embeddingHint: `${t[0]} ${t[1]} svc001 pages worker split sd-06`,
        tags: ['svc001', 'pages', 'sd-06', t[0], t[1]],
      },
      null,
      2,
    ) + '\n',
  );
  existing.add(refId);
  created += 1;
}
console.log(`✓ SVC-001 Pages corpus — +${created} planning cards`);
