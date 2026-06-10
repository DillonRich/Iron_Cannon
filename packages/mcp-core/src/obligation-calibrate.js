import { readEngineJson } from './engine-data.js';
import { verifyObligationCompliance } from './obligation-compare.js';

let bundle;

function loadCalibrationBundle() {
  if (!bundle) {
    bundle = readEngineJson('specimens/fixtures/obligation-calibration/calibration.bundle.json');
  }
  return bundle;
}

/** Calibrate one obligation entry (pass/fail snippets). */
export function calibrateObligationEntry(entry, obligation) {
  if (!entry?.passSnippet) return { ok: false, error: 'NO_PASS_SNIPPET' };
  const pass = verifyObligationCompliance(obligation, entry.passSnippet);
  const fail = verifyObligationCompliance(obligation, entry.failSnippet ?? '');
  const passOk = pass.compliant === true;
  const failOk = fail.compliant === false || fail.compliant === null;
  return {
    ok: passOk && failOk,
    obligationId: entry.obligationId,
    passOk,
    failOk,
    method: pass.method,
  };
}

/** Run full calibration suite (returns failures). */
export function runObligationCalibrationSuite(obligationsById) {
  const cal = loadCalibrationBundle();
  const byId =
    obligationsById ??
    Object.fromEntries(
      readEngineJson('specimens/obligation-index.specimen.json').obligations.map((o) => [o.id, o]),
    );
  const failures = [];
  for (const entry of cal.entries ?? []) {
    const obligation = byId[entry.obligationId];
    if (!obligation) {
      failures.push({ obligationId: entry.obligationId, error: 'MISSING_OBLIGATION' });
      continue;
    }
    const r = calibrateObligationEntry(entry, obligation);
    if (!r.ok) failures.push(r);
  }
  return { total: cal.entries?.length ?? 0, failures };
}
