import { readEngineJson } from '../engine-data.js';
import { retrieveRefs } from '../retrieval.js';
import { verifyObligationCompliance } from '../obligation-compare.js';

const LEGAL_DISCLAIMER =
  'Iron Cannon provides technical comparison only, not legal advice. Consult qualified counsel.';

let obligationIndex;
function loadObligations() {
  if (!obligationIndex) obligationIndex = readEngineJson('specimens/obligation-index.specimen.json');
  return obligationIndex;
}

function obligationsForMarkets(markets) {
  return loadObligations().obligations.filter(
    (o) => !o.markets || o.markets.some((m) => markets.includes(m)),
  );
}

export function mapComplianceObligations(input) {
  const markets = input.primaryMarkets ?? ['us'];
  const rows = obligationsForMarkets(markets);
  return {
    ok: true,
    toolId: 'T12',
    primaryMarkets: markets,
    obligationCount: rows.length,
    layer4SpecimenCoverage: '100/100 obligations have layer4 compare specimens',
    obligations: rows,
    legalDisclaimer: LEGAL_DISCLAIMER,
    agentGuidance: {
      agentMustNot: ['claim legal_compliant'],
      instruction: 'Map obligations per market; use T13 per obligationId with optional snippet verify.',
    },
  };
}

export function getComplianceDirectives(input) {
  const obligationId = input.obligationId;
  const row = loadObligations().obligations.find((o) => o.id === obligationId);
  if (!row) return { ok: false, error: 'MODULE_NOT_FOUND', message: obligationId };

  const tier = input.tier ?? 'ironclad';
  const rag = retrieveRefs(`${row.title} ${row.category} legal compliance`, { tier, topK: 5 });

  let verification = null;
  if (input.snippet != null || input.codeSnippet != null) {
    verification = verifyObligationCompliance(row, input.snippet ?? input.codeSnippet);
  }

  return {
    ok: true,
    toolId: 'T13',
    obligationId,
    directive: row,
    evidenceRefs: (rag.refs ?? []).map((r) => r.refId),
    verification,
    legalDisclaimer: LEGAL_DISCLAIMER,
    agentGuidance:
      verification?.status === 'fail'
        ? { phase: 'OBLIGATION_FAIL', instruction: `Remediate ${obligationId} before claiming readiness.` }
        : verification?.status === 'inconclusive'
          ? {
              phase: 'OBLIGATION_INCONCLUSIVE',
              instruction: `Provide ${(verification.requiredInputs ?? ['snippet']).join(', ')} for ${obligationId}.`,
            }
          : { phase: 'OBLIGATION_REVIEW', instruction: `Implement ${obligationId}; counsel review still required.` },
  };
}

const PRODUCT_CATEGORIES = new Set(['accessibility', 'terms', 'privacy', 'cookies']);
const OPERATIONS_CATEGORIES = new Set(['email', 'records', 'security', 'vendor']);

function obligationMet(id, confirmed, verified) {
  return confirmed.has(id) || verified.has(id);
}

export function auditLegalReadiness(input = {}) {
  const markets = input.primaryMarkets ?? ['us'];
  const rows = obligationsForMarkets(markets);
  const required = rows.filter((o) => o.severity === 'required' || !o.severity);
  const confirmed = new Set(input.confirmedObligationIds ?? []);
  const verified = new Set(input.verifiedObligationIds ?? []);
  if (input.autoConfirmOnT13Pass === true) {
    for (const id of verified) confirmed.add(id);
  }

  const checklist = required.map((o) => ({
    id: o.id,
    title: o.title,
    category: o.category,
    met: obligationMet(o.id, confirmed, verified),
    verified: verified.has(o.id),
    confirmed: confirmed.has(o.id),
  }));
  const unmet = checklist.filter((c) => !c.met).length;

  const productRequired = required.filter((o) => PRODUCT_CATEGORIES.has(o.category));
  const opsRequired = required.filter((o) => OPERATIONS_CATEGORIES.has(o.category));
  const productUnmet = productRequired.filter((o) => !obligationMet(o.id, confirmed, verified)).length;
  const opsUnmet = opsRequired.filter((o) => !obligationMet(o.id, confirmed, verified)).length;

  const productReady = productRequired.length > 0 && productUnmet === 0;
  const operationsReady = productReady && (opsRequired.length === 0 || opsUnmet === 0);
  const counselReady = unmet === 0 && required.length > 0;

  return {
    ok: true,
    toolId: 'T14',
    primaryMarkets: markets,
    ready: counselReady,
    productReady,
    operationsReady,
    counselReady,
    obligationCount: rows.length,
    requiredCount: required.length,
    unmet,
    productUnmet,
    operationsUnmet: opsUnmet,
    checklist: checklist.slice(0, 50),
    checklistTruncated: checklist.length > 50,
    legalDisclaimer: LEGAL_DISCLAIMER,
    summary: counselReady
      ? 'All required obligations confirmed — engage qualified counsel before launch (not legal advice).'
      : productUnmet
        ? `${productUnmet} product-facing obligations unmet (a11y/terms/privacy/cookies).`
        : opsUnmet
          ? `${opsUnmet} operations obligations unmet (email/records/security).`
          : `${unmet} required obligations not confirmed for markets: ${markets.join(', ')}`,
    agentGuidance: {
      phase: counselReady ? 'LEGAL_COUNSEL_REVIEW' : productReady ? 'LEGAL_OPS_REVIEW' : 'LEGAL_BLOCKERS',
      instruction: counselReady
        ? 'Technical checklist complete — counsel sign-off still required.'
        : 'Use T13 with snippets; pass verifiedObligationIds or confirmedObligationIds.',
    },
  };
}
