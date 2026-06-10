import { readEngineJson } from './engine-data.js';

/** Validate module order against golden outbound chain. */
export function validateModuleSequence(moduleId, completedModules = []) {
  const bundle = readEngineJson('specimens/fixtures/e2e/golden-path-outbound.bundle.json');
  const order = bundle.moduleOrder ?? [];
  const idx = order.indexOf(moduleId);
  if (idx < 0) return { ok: true, optional: true };
  const required = order.slice(0, idx);
  const done = new Set(completedModules);
  const missing = required.filter((m) => !done.has(m));
  if (missing.length) {
    return {
      ok: false,
      error: 'MODULE_SEQUENCE_VIOLATION',
      message: `Complete ${missing.join(', ')} before ${moduleId}`,
      missingPrior: missing,
    };
  }
  return { ok: true, index: idx, nextModuleId: order[idx + 1] ?? null };
}
