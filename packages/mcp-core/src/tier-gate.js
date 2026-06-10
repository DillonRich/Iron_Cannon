import { readEngineJson } from './engine-data.js';

let matrix;
export function loadTierMatrix() {
  if (!matrix) matrix = readEngineJson('planning/tier-entitlement-matrix.json');
  return matrix;
}

export function assertToolAllowed(tier, toolId) {
  const m = loadTierMatrix();
  const tool = m.tools.find((t) => t.id === toolId);
  if (!tool) return { ok: false, code: 'MODULE_NOT_FOUND', message: `Unknown tool ${toolId}` };
  const rank = m.tierRank[tier] ?? 0;
  const need = m.tierRank[tool.tierMin] ?? 99;
  if (rank < need) {
    return { ok: false, code: 'TIER_INSUFFICIENT', message: `${toolId} requires ${tool.tierMin}` };
  }
  return { ok: true };
}
