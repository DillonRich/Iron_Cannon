import { readEngineJson } from '../engine-data.js';
import {
  auditInfrastructureReadiness,
  getInfrastructureDirectives,
  mapInfrastructureDomains,
} from './infrastructure.js';

let catalog;
function loadCatalog() {
  if (!catalog) catalog = readEngineJson('phase1/fixtures/armor/surface-catalog.json');
  return catalog;
}

const READINESS_REQUIRED = [
  'M01-auth-d1-schema',
  'M05-auth-session-middleware',
  'M12-stripe-webhook',
  'A02-session-hardening-pass',
  'A03-webhook-hardening-pass',
];

export function mapVulnerabilitySurfaces(input) {
  const CATALOG = loadCatalog();
  const out = [];
  for (const hint of input.surfaceHints ?? []) {
    const match = CATALOG.surfaces.find((s) => s.type === hint.type);
    if (match && !out.some((x) => x.surfaceId === match.surfaceId)) out.push(match);
  }
  const includeInfra = input.includeInfrastructure !== false;
  const infra = includeInfra ? mapInfrastructureDomains({ infraHints: input.infraHints }) : null;
  return {
    ok: true,
    toolId: 'T09',
    surfaces: out,
    infrastructure: infra?.domains ?? [],
  };
}

export function getSecurityDirectives(input) {
  if (input.domainId?.startsWith('INFRA-') || input.surfaceId?.startsWith('INFRA-')) {
    const domainId = input.domainId ?? input.surfaceId;
    const infra = getInfrastructureDirectives({
      domainId,
      tier: input.tier ?? 'armor',
      expectedRps: input.expectedRps,
      expectedUsers: input.expectedUsers,
    });
    if (!infra.ok) return infra;
    return { ok: true, toolId: 'T10', surfaceId: domainId, ...infra };
  }
  const CATALOG = loadCatalog();
  const surface = CATALOG.surfaces.find((s) => s.surfaceId === input.surfaceId);
  if (!surface) return { ok: false, error: 'MODULE_NOT_FOUND', message: input.surfaceId };
  return {
    ok: true,
    toolId: 'T10',
    surfaceId: input.surfaceId,
    devModeRelaxed: !input.productionMode,
    directives: { fragments: surface.requiredMitigations },
  };
}

export function auditProductionReadiness(input) {
  const verified = new Set([
    ...(input.wiremapContext?.verifiedModules ?? []),
    ...(input.confirmedSecurityModules ?? []),
  ]);
  const checklist = READINESS_REQUIRED.map((id) => ({ id, met: verified.has(id) }));
  const unmet = checklist.filter((c) => !c.met).length;
  const devPatternsToUpgrade =
    verified.has('M12-stripe-webhook') && !verified.has('A03-webhook-hardening-pass') ? 1 : 0;

  const infra = auditInfrastructureReadiness({
    wiremapContext: input.wiremapContext,
    confirmedChecklistIds: input.confirmedChecklistIds,
    verifiedInfraDomains: input.verifiedInfraDomains,
    autoConfirmRelatedModules: input.autoConfirmInfra === true,
  });

  const securityReady = unmet === 0 && devPatternsToUpgrade === 0;
  const ready = securityReady && infra.infraVerified;

  return {
    ok: true,
    toolId: 'T11',
    ready,
    securityReady,
    infraReady: infra.infraReady,
    infraVerified: infra.infraVerified,
    infraAcknowledged: infra.infraAcknowledged,
    minUnmet: unmet,
    devPatternsToUpgrade,
    checklist,
    infrastructure: infra,
    agentGuidance: {
      phase: ready ? 'PRODUCTION_READY' : 'PRODUCTION_BLOCKED',
      instruction: ready
        ? 'Security + infrastructure gates passed for required domains.'
        : infra.blockingDomains?.length
          ? `Infrastructure blockers: ${infra.blockingDomains.join(', ')}. Confirm checklist items or complete related modules.`
          : 'Complete security checklist modules before production.',
    },
  };
}
