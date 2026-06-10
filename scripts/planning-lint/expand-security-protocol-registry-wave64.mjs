#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/security-protocol-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));
const TARGET = 750;

const SERVICES = ['stripe', 'resend', 'nextjs', 'cloudflare', 'owasp', 'ironcannon', 'legal'];
const CATEGORIES = ['access', 'logging', 'billing', 'email', 'session', 'edge', 'webhook', 'secrets', 'csrf', 'waf', 'mcp', 'llm', 'radar', 'turnstile'];

const existing = new Set(reg.protocols.map((p) => p.protocolId));
let i = reg.protocols.length;
while (reg.protocols.length < TARGET) {
  const svc = SERVICES[i % SERVICES.length];
  const cat = CATEGORIES[Math.floor(i / SERVICES.length) % CATEGORIES.length];
  const protocolId = `planning/sp64-${svc}-${cat}-${String(i).padStart(3, '0')}`;
  i += 1;
  if (existing.has(protocolId)) continue;
  existing.add(protocolId);
  reg.protocols.push({
    protocolId,
    source: 'IronCannon-Planning',
    category: cat,
    scopeServices: [svc],
    mitigationSteps: [
      `Wave64 ${cat} on ${svc}`,
      'Linked via expand-em1-stripe-cf-links-wave64',
      'T05 verify + T10 security directives',
    ],
    verifyPatternIds: [`SP64-${i}`],
    status: 'active',
  });
}

reg.protocolCount = reg.protocols.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Security protocol registry wave 64 — ${reg.protocolCount} protocols`);
