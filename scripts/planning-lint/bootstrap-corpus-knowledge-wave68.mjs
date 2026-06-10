#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF = join(ROOT, 'docs/engine/specimens/references');

const MICRO = [
  ['owasp', 'abuse-case-auth', 'Document abuse cases for login, reset, and billing before ship'],
  ['owasp', 'clickjacking-frame-deny', 'Use X-Frame-Options or CSP frame-ancestors on account pages'],
  ['owasp', 'secure-ai-review', 'Human review required for AI-generated security-sensitive diffs'],
  ['owasp', 'prompt-injection-sanitize', 'Strip instruction-like patterns from user text before LLM tool args'],
  ['nextjs', 'app-router-auth-session', 'Use Next.js App Router auth patterns; server-side session validation'],
  ['stripe', 'customer-portal-cancel', 'Expose Stripe Customer Portal for subscription self-service'],
  ['ironcannon', 'adversarial-agent-gate', 'Run g2:adversarial-agent before production MCP release'],
  ['ironcannon', 'tier-tool-parity', 'MCP tools-list must match tier-entitlement-matrix for each tier'],
  ['ironcannon', 'agent-guidance-required', 'Every MCP response includes agentGuidance with next steps'],
  ['legal', 'csrf-state-changing', 'CSRF protection on all state-changing browser POST endpoints'],
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
  const refId = `${provider}/knowledge-w68-${slug}`;
  if (existingRef.has(refId)) continue;
  writeFileSync(
    join(REF, `${provider}-knowledge-w68-${slug}.specimen.json`),
    JSON.stringify(
      {
        refId,
        sourceUrl: `https://ironcannon.dev/knowledge/w68/${slug}`,
        lastVerified: '2026-06-06',
        title: `W68 ${slug}`,
        provider,
        excerpt,
        embeddingHint: `${provider} ${slug} wave68 adversarial`,
        tags: ['wave68', 'knowledge', provider, 'adversarial'],
      },
      null,
      2,
    ) + '\n',
  );
  added += 1;
}
console.log(`✓ Knowledge wave68 corpus — ${added} micro cards added`);
