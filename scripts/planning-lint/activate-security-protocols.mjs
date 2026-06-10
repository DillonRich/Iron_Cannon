#!/usr/bin/env node
/** Activate planned security protocols with agent-ready mitigations */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/security-protocol-registry.json');
const reg = JSON.parse(readFileSync(path, 'utf8'));

const TEMPLATES = {
  access: ['Document who can access this surface', 'Deny by default in middleware', 'Log denied attempts without PII'],
  injection: ['Validate and parameterize all inputs', 'Reject unexpected content-types', 'Add T05 pattern proof'],
  session: ['Set secure cookie flags', 'Rotate session on privilege change', 'Run T09 surface map when Armor+'],
  webhook: ['Verify provider signature on raw body', 'Idempotency store before side effects', 'Return 2xx only after commit'],
  email: ['Use verified domain only', 'Separate transactional vs marketing templates', 'Handle bounces via webhook'],
  edge: ['Detect signal in T02/T07', 'Link EC registry row in agent directive', 'Re-run T05 before module complete'],
  default: ['Read official doc card in corpus', 'Implement control in module code', 'Prove with T05 fixture before complete'],
};

function templateFor(p) {
  const cat = p.category ?? 'default';
  if (TEMPLATES[cat]) return TEMPLATES[cat];
  if (p.protocolId.includes('webhook')) return TEMPLATES.webhook;
  if (p.protocolId.includes('session')) return TEMPLATES.session;
  return TEMPLATES.default;
}

let activated = 0;
for (const p of reg.protocols) {
  const steps = p.mitigationSteps ?? [];
  if (steps.length < 2) {
    p.mitigationSteps = templateFor(p);
  }
  if ((p.mitigationSteps?.length ?? 0) >= 2 && p.status !== 'active') {
    p.status = 'active';
    activated++;
  }
}
reg.protocolCount = reg.protocols.length;
writeFileSync(path, JSON.stringify(reg, null, 2) + '\n');
console.log(`✓ Security protocols — ${activated} activated (${reg.protocols.filter((p) => p.status === 'active').length} active)`);
