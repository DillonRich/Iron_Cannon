import { evaluateCompare } from '@ironcannon/compare';
import { readEngineJson } from './engine-data.js';
import { patternsSatisfied } from './t05-verify.js';
import { verifyObligationSnippet } from './obligation-verify.js';

/** Layer4 specimen path for obligation id. */
export function obligationSpecimenPath(obligationId) {
  return `specimens/layer4/obligation-${obligationId}.specimen.json`;
}

export function loadObligationSpecimen(obligationId) {
  try {
    return readEngineJson(obligationSpecimenPath(obligationId));
  } catch {
    return null;
  }
}

function requiredInputsFor(obligation, reason) {
  const detectType = obligation?.detect?.type;
  const inputs = [];
  if (reason === 'no_snippet') inputs.push('snippet', 'codeSnippet');
  if (['required_route', 'route_exists', 'route_link'].includes(detectType)) {
    inputs.push('route', 'snippet');
  }
  if (reason === 'manual_review') inputs.push('manualReviewCompleted');
  if (reason === 'advisory_compare') inputs.push('counselReview', 'jurisdiction');
  return [...new Set(inputs)];
}

/** Tri-state T13 verification with actionable reasons (G-61). */
export function normalizeT13Verification(raw, obligation, snippet) {
  if (!String(snippet ?? '').trim()) {
    return {
      status: 'inconclusive',
      compliant: null,
      reason: 'no_snippet',
      requiredInputs: requiredInputsFor(obligation, 'no_snippet'),
      method: raw?.method ?? 'none',
    };
  }
  if (raw.compliant === null) {
    return {
      status: 'inconclusive',
      compliant: null,
      reason: raw.reason ?? 'unsupported',
      requiredInputs: requiredInputsFor(obligation, raw.reason),
      method: raw.method,
      detectType: obligation?.detect?.type,
      note: raw.note,
    };
  }
  if (raw.compliant === true) {
    return {
      status: 'pass',
      compliant: true,
      method: raw.method,
      compareStatus: raw.compareStatus,
      patterns: raw.patterns,
      specimenId: raw.specimenId,
    };
  }
  return {
    status: 'fail',
    compliant: false,
    missing: raw.missing ?? [],
    searchedFor: raw.missing ?? raw.patterns ?? [obligation?.detect?.path, obligation?.detect?.patterns].flat().filter(Boolean),
    foundInstead: 'pattern_not_matched_in_snippet',
    method: raw.method,
    compareStatus: raw.compareStatus,
    patterns: raw.patterns,
    specimenId: raw.specimenId,
  };
}

/**
 * Verify obligation snippet — prefer layer4 compare when specimen exists.
 */
export function verifyObligationCompliance(obligation, snippet) {
  if (!snippet?.trim()) {
    return normalizeT13Verification({ compliant: null, reason: 'no_snippet', method: 'none' }, obligation, snippet);
  }

  const specimen = loadObligationSpecimen(obligation?.id);
  if (specimen?.compliancePatterns?.required?.length) {
    const patternIds = specimen.compliancePatterns.required.map((p) => p.id);
    const detect = obligation?.detect ?? specimen.compliancePatterns.required[0];

    if (detect?.type) {
      const status = evaluateCompare(detect.type, snippet, detect);
      if (status === 'advisory') {
        return normalizeT13Verification(
          { compliant: null, reason: 'advisory_compare', compareStatus: status, method: 'layer4-compare' },
          obligation,
          snippet,
        );
      }
      const compliant = status === 'met' || status === true;
      return normalizeT13Verification(
        {
          compliant,
          missing: compliant ? [] : [detect.type],
          method: 'layer4-compare',
          patterns: patternIds,
          specimenId: specimen.id,
          compareStatus: status,
        },
        obligation,
        snippet,
      );
    }

    const v = patternsSatisfied({ patternsUnderTest: patternIds }, snippet);
    return normalizeT13Verification(
      {
        compliant: v.met,
        missing: v.missing,
        method: 'layer4-patterns',
        patterns: patternIds,
        specimenId: specimen.id,
      },
      obligation,
      snippet,
    );
  }

  const heuristic = verifyObligationSnippet(obligation, snippet);
  return normalizeT13Verification({ ...heuristic, method: 'heuristic' }, obligation, snippet);
}
