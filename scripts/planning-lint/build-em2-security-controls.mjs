#!/usr/bin/env node
/** EM-2 — link security-protocol-registry → em1 flow steps */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const em1 = JSON.parse(readFileSync(join(ROOT, 'docs/engine/planning/em1-flow-steps.json'), 'utf8'));
const registry = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/security-protocol-registry.json'), 'utf8'),
);

const protoById = Object.fromEntries(registry.protocols.map((p) => [p.protocolId, p]));
const controls = [];
const seen = new Set();

function addControl(c) {
  const key = `${c.flowStepId}|${c.protocolId}`;
  if (seen.has(key)) return;
  seen.add(key);
  controls.push(c);
}

for (const step of em1.nodes) {
  const moduleId = step.moduleIds?.[0];
  const defaults = registry.moduleDefaults?.[moduleId] ?? [];
  const fromEffects = (step.securityEffects ?? []).flatMap((e) => registry.effectToProtocol?.[e] ?? []);
  const protocolIds = [...new Set([...defaults, ...fromEffects])];

  for (const protocolId of protocolIds) {
    const proto = protoById[protocolId];
    if (!proto) continue;
    addControl({
      controlId: `ctrl/${step.nodeId}/${protocolId.replace(/\//g, '-')}`,
      flowStepId: step.nodeId,
      moduleId,
      phase: step.phase,
      protocolId,
      host: step.host,
      route: step.route,
      mitigationSteps: proto.mitigationSteps ?? [],
      verifyPatternIds: proto.verifyPatternIds ?? [],
      status: proto.status ?? 'active',
    });
  }

  const phaseExtras = {
    TEST: ['generic/audit-log-auth', 'owasp/logging-pii'],
    SECURITY: ['armor/surface-session', 'armor/surface-webhook', 'armor/surface-env'],
    SECURITY_AUDIT: ['owasp/logging-pii', 'generic/audit-log-auth'],
    MONITOR: ['owasp/logging-pii'],
    OBSERVABILITY: ['owasp/logging-pii'],
    TOOL_GATE: ['generic/review-step'],
    COMPLIANCE: ['ironcannon/verify-mandate'],
    COMPLIANCE_AUDIT: ['ironcannon/verify-mandate'],
    UX_COMPLIANCE: ['legal/wcag-alt-text'],
  };
  for (const pid of phaseExtras[step.phase] ?? []) {
    const proto = protoById[pid];
    if (!proto) continue;
    addControl({
      controlId: `ctrl/${step.nodeId}/${pid.replace(/\//g, '-')}`,
      flowStepId: step.nodeId,
      moduleId,
      phase: step.phase,
      protocolId: pid,
      host: step.host,
      route: step.route,
      mitigationSteps: proto.mitigationSteps ?? [],
      verifyPatternIds: proto.verifyPatternIds ?? [],
      status: proto.status ?? 'active',
    });
  }

  if (step.lattice === 'wave46' || String(step.nodeId ?? '').startsWith('lattice/')) {
    for (const pid of ['owasp/logging-pii', 'generic/audit-log-auth']) {
      const proto = protoById[pid];
      if (!proto) continue;
      addControl({
        controlId: `ctrl/${step.nodeId}/${pid.replace(/\//g, '-')}`,
        flowStepId: step.nodeId,
        moduleId: step.moduleIds?.[0],
        phase: step.phase,
        protocolId: pid,
        host: step.host,
        route: step.route,
        mitigationSteps: proto.mitigationSteps ?? [],
        verifyPatternIds: proto.verifyPatternIds ?? [],
        status: proto.status ?? 'active',
      });
    }
  }

  if (protocolIds.length === 0 && step.phase === 'BUILD') {
    addControl({
      controlId: `ctrl/${step.nodeId}/generic/review`,
      flowStepId: step.nodeId,
      moduleId,
      phase: step.phase,
      protocolId: 'generic/review-step',
      host: step.host,
      route: step.route,
      mitigationSteps: ['Review EM-2 matrix for module before complete'],
      verifyPatternIds: [],
      status: 'planned',
    });
  }
}

for (const [moduleId, pids] of Object.entries(registry.moduleDefaults ?? {})) {
  for (const phase of ['TEST', 'SECURITY']) {
    const nodeId = `step/${moduleId}/${phase.toLowerCase()}`;
    for (const protocolId of pids.slice(0, 2)) {
      const proto = protoById[protocolId];
      if (!proto) continue;
      addControl({
        controlId: `ctrl/${nodeId}/${protocolId.replace(/\//g, '-')}`,
        flowStepId: nodeId,
        moduleId,
        phase,
        protocolId,
        host: 'planning',
        route: `/internal/${moduleId}`,
        mitigationSteps: proto.mitigationSteps ?? [],
        verifyPatternIds: proto.verifyPatternIds ?? [],
        status: 'active',
      });
    }
  }
}

const out = {
  rulesetVersion: registry.rulesetVersion,
  controlCount: controls.length,
  linkedFlowSteps: em1.nodeCount,
  controls,
};

const outPath = join(ROOT, 'docs/engine/planning/em2-security-controls.json');
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`✓ EM-2 security controls: ${controls.length} (from ${em1.nodeCount} flow steps)`);
