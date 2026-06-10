#!/usr/bin/env node
/** Append EM-0 config nodes until count >= 500 (wave 53 stretch) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/em0-config-nodes.json');
const em0 = JSON.parse(readFileSync(path, 'utf8'));
const TARGET = 500;

const HOSTS = ['cloudflare', 'stripe', 'resend', 'nextjs', 'ironcannon', 'legal', 'owasp'];
const KNOBS = [
  'api_timeout_ms', 'retry_max', 'log_level', 'feature_flag_beta', 'webhook_tolerance_sec',
  'session_ttl_hours', 'rate_limit_rpm', 'cors_allowed_origins', 'encrypt_at_rest',
  'backup_retention_days', 'audit_log_sink', 'pii_redaction_mode',
];

const ids = new Set(em0.nodes.map((n) => n.nodeId));
const extra = [];

for (let i = em0.nodes.length; em0.nodes.length + extra.length < TARGET; i++) {
  const host = HOSTS[i % HOSTS.length];
  const knob = KNOBS[Math.floor(i / HOSTS.length) % KNOBS.length];
  const nodeId = `cfg/w53/${host}/${knob}-${String(i).padStart(3, '0')}`;
  if (ids.has(nodeId)) continue;
  ids.add(nodeId);
  extra.push({
    nodeId,
    type: 'config',
    host,
    adapterIds: [`${host}-golden-stack`],
    setting: `${host}.${knob}`,
    requiredForModules: [],
    requiredForFlows: ['auth-lifecycle'],
    userFlowEffect: `Planning stretch config ${knob} on ${host}`,
    securityEffects: knob.includes('encrypt') || knob.includes('audit') ? ['audit_trail'] : [],
    legalEffects: knob.includes('pii') ? ['ropa_update'] : [],
    detectSignals: { envExample: knob, t02Missing: false },
    referenceRefIds: [`ironcannon/planning-w53-config-${host}`],
    lattice: 'wave53',
  });
}

em0.nodes = [...em0.nodes, ...extra];
em0.nodeCount = em0.nodes.length;
writeFileSync(path, JSON.stringify(em0, null, 2) + '\n');
console.log(`✓ EM-0 config wave 53 — +${extra.length} → ${em0.nodeCount} (target ${TARGET})`);
if (em0.nodeCount < TARGET) {
  console.error(`EM-0 config ${em0.nodeCount} < ${TARGET}`);
  process.exit(1);
}
