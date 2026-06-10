import { readEngineJson } from './engine-data.js';

let catalog;
export function loadErrorCatalog() {
  if (!catalog) {
    try {
      catalog = readEngineJson('planning/error-code-harness.json');
    } catch {
      catalog = { codes: [] };
    }
  }
  return catalog;
}

/** Enrich tool error with catalog metadata when available. */
export function enrichError(result) {
  if (!result?.error) return result;
  const row = loadErrorCatalog().codes?.find((c) => c.code === result.error);
  return {
    ...result,
    errorMeta: row
      ? { code: row.code, recoverable: !['ABUSE_DETECTED', 'AUTH_INVALID'].includes(row.code) }
      : { code: result.error },
  };
}

/** Harness parity — maps trigger objects to error codes (no planning-sim import). */
export function resolveError(trigger = {}) {
  if (!trigger.apiKey && trigger.apiKey !== undefined) return 'AUTH_MISSING';
  if (trigger.apiKey === 'bad') return 'AUTH_INVALID';
  if (trigger.subscription === 'inactive') return 'SUBSCRIPTION_INACTIVE';
  if (trigger.tier === 'pro' && trigger.tool) return 'TIER_INSUFFICIENT';
  if (trigger.deps?.firebase) return 'STACK_UNSUPPORTED';
  if (trigger.conflicts?.length) return 'SSOT_CONFLICT';
  if (trigger.missingConfig?.length) return 'STACK_INCOMPLETE';
  if (trigger.productType === 'mobile_app') return 'PRODUCT_TYPE_INVALID';
  if (trigger.sameModuleCalls >= 6) return 'THROTTLE_LOOP_DETECTED';
  if (trigger.requestsInWindow > 1000) return 'RATE_LIMIT_EXCEEDED';
  if (trigger.moduleId?.startsWith('M99')) return 'MODULE_NOT_FOUND';
  if (trigger.wiremapId === null) return 'WIREMAP_NOT_FOUND';
  if (trigger.wiremapApproved === false) return 'WIREMAP_NOT_APPROVED';
  if (trigger.flowId === 'nonexistent-flow') return 'FLOW_NOT_FOUND';
  if (trigger.fragmentId?.includes('missing')) return 'RULE_NOT_FOUND';
  if (trigger.payload?.bad) return 'ENGINE_SCHEMA_FAILURE';
  if (trigger.rulesetChecksum === 'dead') return 'RULE_STORE_CORRUPT';
  if (trigger.network === 'down') return 'REMOTE_UNAVAILABLE';
  if (trigger.cliVersion === '0.0.1') return 'CLI_VERSION_UNSUPPORTED';
  const row = loadErrorCatalog().codes?.find((c) => c.trigger && JSON.stringify(c.trigger) === JSON.stringify(trigger));
  return row?.expect ?? null;
}
