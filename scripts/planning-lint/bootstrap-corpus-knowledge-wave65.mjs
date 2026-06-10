#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['legal', 'cookie-consent-gate', 'Block non-essential cookies and trackers until user accepts via consent banner'],
  ['legal', 'ccpa-notice-collection', 'Display CCPA notice at or before personal information collection points'],
  ['legal', 'coppa-age-gate', 'Block account creation for users under 13 without verifiable parental consent'],
  ['legal', 'ai-feature-disclosure', 'Disclose when AI automates decisions affecting users per emerging AI transparency rules'],
  ['legal', 'eu-scc-transfer', 'Document Standard Contractual Clauses or adequacy for EU data transfers'],
  ['legal', 'status-page-incident', 'Link public status page in incident emails and in-app banners'],
  ['owasp', 'csp-report-endpoint', 'Configure CSP report-uri or report-to to collect violation telemetry'],
  ['resend', 'domain-verify-prod', 'Verify Resend sending domain DNS before enabling production transactional mail'],
  ['ironcannon', 'obligation-160-floor', 'IronClad T12 obligation filter uses primaryMarkets; planning floor 160+'],
  ['stripe', 'customer-portal-cancel', 'Stripe Customer Portal allows self-service subscription cancel per billing policy'],
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
  const refId = `${provider}/knowledge-w65-${slug}`;
  if (existingRef.has(refId)) continue;
  writeFileSync(
    join(REF, `${provider}-knowledge-w65-${slug}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w65/${slug}`,
        lastVerified: '2026-06-06',
        title: `W65 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave65 legal security`,
        tags: ['wave65', 'knowledge', provider],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}
console.log(`✓ Knowledge wave65 corpus — ${added} micro cards added`);
