import { readEngineJson } from '../engine-data.js';
import { retrieveRefs } from '../retrieval.js';

let catalog;

function loadInfraCatalog() {
  if (!catalog) catalog = readEngineJson('phase1/fixtures/armor/infrastructure-catalog.json');
  return catalog;
}

/** Map infrastructure domains relevant to stack hints (Armor+). */
export function mapInfrastructureDomains(input = {}) {
  const C = loadInfraCatalog();
  const hints = new Set((input.infraHints ?? []).map((h) => h.type ?? h));
  const domains =
    hints.size > 0
      ? C.domains.filter((d) => hints.has(d.surfaceType) || hints.has(d.domainId))
      : C.domains;
  return {
    ok: true,
    scope: C.stackScope,
    domains: domains.map((d) => ({
      domainId: d.domainId,
      title: d.title,
      surfaceType: d.surfaceType,
      riskIfIgnored: d.riskIfIgnored,
      checklistCount: d.checklist.length,
      relatedModules: d.relatedModules,
    })),
  };
}

export function getInfrastructureDirectives(input = {}) {
  const C = loadInfraCatalog();
  const domain = C.domains.find((d) => d.domainId === input.domainId);
  if (!domain) {
    return { ok: false, error: 'FLOW_NOT_FOUND', message: `Unknown infra domain ${input.domainId}` };
  }
  const tier = input.tier ?? 'armor';
  const rag = retrieveRefs(domain.retrievalQueries?.[0] ?? domain.title, {
    tier,
    topK: 5,
  });
  const scaleNotes = [];
  if (input.expectedRps != null) {
    scaleNotes.push(`Target peak RPS: ${input.expectedRps} — validate Worker CPU and D1 query budget.`);
  }
  if (input.expectedUsers != null) {
    scaleNotes.push(
      `Target user scale: ${input.expectedUsers} — run INFRA-STRESS ramp before marketing spikes.`,
    );
  }
  return {
    ok: true,
    domainId: domain.domainId,
    title: domain.title,
    riskIfIgnored: domain.riskIfIgnored,
    directives: domain.directives,
    checklist: domain.checklist,
    scaleNotes,
    evidenceRefs: (rag.refs ?? []).slice(0, 5).map((r) => r.refId),
    agentGuidance: {
      phase: 'INFRA_HARDEN',
      instruction: `Complete checklist for ${domain.domainId} before claiming production-ready at scale.`,
    },
  };
}

/**
 * Audit infrastructure readiness against completed modules + optional user confirmations.
 */
export function auditInfrastructureReadiness(input = {}) {
  const C = loadInfraCatalog();
  const done = new Set(input.wiremapContext?.completedModules ?? []);
  const confirmed = new Set(input.confirmedChecklistIds ?? []);
  const verifiedDomains = new Set(input.verifiedInfraDomains ?? []);
  const autoAck = input.autoConfirmRelatedModules === true;

  const domainResults = C.domains.map((domain) => {
    const moduleOverlap = domain.relatedModules?.some((m) => done.has(m)) ?? false;
    const domainVerified = verifiedDomains.has(domain.domainId);
    const items = domain.checklist.map((item) => {
      const confirmedMet = confirmed.has(item.id);
      const verifiedMet = confirmedMet || domainVerified;
      const acknowledged = confirmedMet || (autoAck && moduleOverlap);
      return {
        ...item,
        met: verifiedMet,
        acknowledged,
        autoInferred: acknowledged && !confirmedMet && !domainVerified,
        verificationSource: confirmedMet
          ? 'confirmed'
          : domainVerified
            ? 'verifiedDomain'
            : acknowledged
              ? 'acknowledged'
              : 'none',
      };
    });
    const unmetVerified = items.filter((i) => !i.met).length;
    const unmetAcknowledged = items.filter((i) => !i.acknowledged).length;
    return {
      domainId: domain.domainId,
      title: domain.title,
      riskIfIgnored: domain.riskIfIgnored,
      unmet: unmetVerified,
      unmetAcknowledged,
      verified: unmetVerified === 0,
      acknowledged: unmetAcknowledged === 0,
      items,
    };
  });

  const required = new Set(C.productionGate?.requiredDomains ?? []);
  const blockingVerified = domainResults.filter(
    (d) => required.has(d.domainId) && d.unmet > 0,
  );
  const blockingAcknowledged = domainResults.filter(
    (d) => required.has(d.domainId) && d.unmetAcknowledged > 0,
  );
  const totalUnmet = domainResults.reduce((n, d) => n + d.unmet, 0);

  return {
    ok: true,
    infraReady: blockingVerified.length === 0,
    infraVerified: blockingVerified.length === 0,
    infraAcknowledged: blockingAcknowledged.length === 0,
    blockingDomains: blockingVerified.map((d) => d.domainId),
    totalUnmet,
    domains: domainResults,
    agentGuidance: {
      phase: blockingVerified.length ? 'INFRA_BLOCKERS' : 'INFRA_PASS',
      instruction: blockingVerified.length
        ? `Confirm INFRA checklist items or pass verifiedInfraDomains — autoConfirmInfra only acknowledges, it does not verify load tests. Blockers: ${blockingVerified.map((d) => d.domainId).join(', ')}.`
        : 'Infrastructure verified for required domains — keep stress tests current as traffic grows.',
    },
  };
}
