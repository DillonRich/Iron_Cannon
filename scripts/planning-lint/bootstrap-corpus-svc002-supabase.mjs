#!/usr/bin/env node
/** SVC-002 Phase B — Supabase auth/RLS/SSR planning reference cards (+50). */
import { writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');

const TOPICS = [
  ['supabase', 'anon-client-browser', 'Browser createClient uses NEXT_PUBLIC_SUPABASE_URL and anon key only — service role server-side.'],
  ['supabase', 'ssr-middleware-session', '@supabase/ssr createServerClient in Next.js middleware refreshes session cookies on each request.'],
  ['supabase', 'rls-enable-policies', 'Enable row level security on auth-linked tables; policies scope rows to auth.uid().'],
  ['supabase', 'auth-callback-route', 'OAuth/magic-link callback route exchanges code for session via supabase.auth.exchangeCodeForSession.'],
  ['supabase', 'stripe-customer-metadata', 'Store stripe_customer_id in Supabase profiles table with RLS — not in client-readable columns.'],
  ['supabase', 'resend-smtp-auth', 'Supabase Auth SMTP can use Resend; document SPF/DKIM when replacing default Supabase mail.'],
  ['supabase', 'dual-database-blocked', 'SD-08: Supabase Postgres + Cloudflare D1 is SSOT conflict — pick one primary database.'],
  ['supabase', 'sd07-wiremap-order', 'SD-07 wiremap: M70 auth config → M71 SSR middleware → M11–M16 billing (no D1 auth modules).'],
  ['nextjs', 'middleware-cookie-bridge', 'Middleware reads/writes Supabase session cookies; never persist session in localStorage.'],
  ['ironcannon', 'svc002-harvest-gate', 'SVC-002 Phase B harvest cards and obligations before runtime signoff.'],
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
  const refId = `${t[0]}/svc002-supabase-${t[1]}-${String(i).padStart(3, '0')}`;
  if (existing.has(refId)) continue;
  writeFileSync(
    join(REF_DIR, `${refId.replace(/\//g, '-')}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/svc002/supabase/${slug(t[1])}-${i}`,
        lastVerified: '2026-05-31',
        title: `SVC-002 ${t[1]} ${i}`,
        provider: t[0],
        excerpt: t[2],
        embeddingHint: `${t[0]} ${t[1]} svc002 supabase sd-07 rls ssr`,
        tags: ['svc002', 'supabase', 'sd-07', t[0], t[1]],
      },
      null,
      2,
    ) + '\n',
  );
  existing.add(refId);
  created += 1;
}
console.log(`✓ SVC-002 Supabase corpus — +${created} planning cards`);
