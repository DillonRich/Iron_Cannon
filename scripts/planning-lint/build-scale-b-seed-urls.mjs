#!/usr/bin/env node
/** Scale-B seed URLs — planning-only harvest targets (first 50 high-value) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SEEDS = [
  { provider: 'owasp', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html', topic: 'auth' },
  { provider: 'owasp', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html', topic: 'session' },
  { provider: 'owasp', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html', topic: 'csrf' },
  { provider: 'owasp', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', topic: 'password' },
  { provider: 'owasp', url: 'https://owasp.org/www-project-top-ten/', topic: 'top10' },
  { provider: 'cloudflare', url: 'https://developers.cloudflare.com/workers/', topic: 'workers' },
  { provider: 'cloudflare', url: 'https://developers.cloudflare.com/d1/', topic: 'd1' },
  { provider: 'cloudflare', url: 'https://developers.cloudflare.com/kv/', topic: 'kv' },
  { provider: 'cloudflare', url: 'https://developers.cloudflare.com/r2/', topic: 'r2' },
  { provider: 'nextjs', url: 'https://nextjs.org/docs/app/building-your-application/routing/middleware', topic: 'middleware' },
  { provider: 'nextjs', url: 'https://nextjs.org/docs/app/building-your-application/authentication', topic: 'auth' },
  { provider: 'stripe', url: 'https://docs.stripe.com/webhooks', topic: 'webhooks' },
  { provider: 'stripe', url: 'https://docs.stripe.com/billing/subscriptions/overview', topic: 'billing' },
  { provider: 'stripe', url: 'https://docs.stripe.com/connect', topic: 'connect' },
  { provider: 'stripe', url: 'https://docs.stripe.com/radar', topic: 'radar' },
  { provider: 'resend', url: 'https://resend.com/docs/dashboard/webhooks/introduction', topic: 'webhooks' },
  { provider: 'resend', url: 'https://resend.com/docs/dashboard/domains/introduction', topic: 'domains' },
  { provider: 'legal', url: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business', topic: 'can-spam' },
  { provider: 'legal', url: 'https://www.w3.org/WAI/WCAG21/quickref/', topic: 'wcag' },
  { provider: 'ironcannon', url: 'https://ironcannon.dev/planning/tier-redaction', topic: 'tier' },
];

const queue = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/scale-b-harvest-queue.json'), 'utf8'),
);

const out = {
  $schema: 'https://ironcannon.dev/schemas/scale-b-seed-urls/v1',
  rulesetVersion: queue.rulesetVersion,
  targetCardCount: queue.targetCardCount,
  seedCount: SEEDS.length,
  status: 'planning-only',
  seeds: SEEDS,
  note: 'Run harvest:fetch with operator approval; not executed in planning waves',
};

writeFileSync(
  join(ROOT, 'docs/engine/planning/scale-b-seed-urls.json'),
  JSON.stringify(out, null, 2) + '\n',
);
console.log(`✓ Scale-B seed URLs — ${SEEDS.length} entries`);
