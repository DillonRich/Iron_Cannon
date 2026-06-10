#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['legal', 'legitimate-interest-record', 'Document legitimate interest assessment when using analytics without consent in EU'],
  ['legal', 'dsar-30-day', 'Respond to data subject access requests within 30 days per GDPR Article 12'],
  ['legal', 'ccpa-opt-out-link', 'Do Not Sell My Personal Information link for California residents when selling data'],
  ['owasp', 'mcp-tool-authz', 'MCP servers must authorize each tool call; never expose env or shell via tools'],
  ['owasp', 'rag-poisoning', 'Validate retrieved corpus chunks before injecting into compose prompts'],
  ['ironcannon', 't10-before-t11', 'Run get_security_directives before audit_production_readiness with domainId'],
  ['ironcannon', 'ironclad-markets', 'Declare primaryMarkets in T01 stack context for T12 obligation filter'],
  ['stripe', 'payment-intent-3ds', 'Enable 3DS when Radar recommends for high-risk PaymentIntents'],
  ['cloudflare', 'bot-fight-mode', 'Enable Bot Fight Mode or Super Bot Fight on auth routes only after false-positive review'],
  ['resend', 'suppression-list-sync', 'Sync Resend suppression with app DB on bounce and complaint webhooks'],
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
  const refId = `${provider}/knowledge-w63-${slug}`;
  if (existingRef.has(refId)) continue;
  writeFileSync(
    join(REF, `${provider}-knowledge-w63-${slug}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w63/${slug}`,
        lastVerified: '2026-06-06',
        title: `W63 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave63 legal security`,
        tags: ['wave63', 'knowledge', provider],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}
console.log(`✓ Knowledge wave63 corpus — ${added} micro cards added`);
