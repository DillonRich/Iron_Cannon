import { randomUUID } from 'crypto';
import { getRulesetVersion } from './ruleset.js';

export function createInvokeContext(ctx = {}) {
  const startedAt =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  return {
    requestId: ctx.requestId ?? randomUUID(),
    startedAt,
    tier: ctx.tier ?? 'pro',
    toolId: ctx.toolId,
  };
}

export function attachInvokeMeta(result, inv) {
  if (!result || typeof result !== 'object') return result;
  const end =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  const durationMs = Math.round(end - inv.startedAt);
  const telemetry = {
    requestId: inv.requestId,
    durationMs,
    rulesetVersion: getRulesetVersion(),
    tier: inv.tier,
    toolId: result.toolId ?? inv.toolId,
  };
  if (result.meta && typeof result.meta === 'object') {
    return { ...result, meta: { ...result.meta, telemetry } };
  }
  return { ...result, meta: { telemetry } };
}
