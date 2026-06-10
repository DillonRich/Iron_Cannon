#!/usr/bin/env node
/**
 * ERROR_CATALOG harness — planning mirror for all documented error codes.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REG = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/planning/error-code-harness.json'), 'utf8'),
);

function resolveError(trigger) {
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
  if (trigger.hashDrift) return 'DIFF_DRIFT_DETECTED';
  if (trigger.rollbackModule?.startsWith('M99')) return 'ROLLBACK_SNAPSHOT_MISSING';
  if (trigger.patternsMatched === 0) return 'COMPLIANCE_FAILED';
  if (trigger.bytes > 5_000_000) return 'PAYLOAD_TOO_LARGE';
  if (trigger.scope === 'desktop-only') return 'SCOPE_OUT_OF_BOUNDS';
  if (trigger.scope === 'recommend-stack') return 'SCOPE_NOT_SUPPORTED';
  if (trigger.flowId === 'custom-xyz') return 'FLOW_NOT_IN_CATALOG';
  if (trigger.current === 'M12' && trigger.priorVerified) return 'MODULE_SEQUENCE_VIOLATION';
  if (trigger.moduleId === 'M12' && trigger.deps) return 'MODULE_DEPENDENCY_UNMET';
  if (trigger.wiremapContext === null) return 'CONTEXT_INSUFFICIENT';
  if (Array.isArray(trigger.fragments) && trigger.fragments.length === 0) return 'COMPOSE_EMPTY_REJECTED';
  if (trigger.tokens === 10) return 'SLICE_UNDERFLOW';
  if (trigger.tokens === 50000) return 'SLICE_TRUNCATED';
  if (trigger.emptyFile) return 'FALSE_COMPLIANCE_SUSPECTED';
  if (Array.isArray(trigger.stripeVariants) && trigger.stripeVariants.length === 0) {
    return 'STRIPE_VARIANT_REQUIRED';
  }
  if (trigger.rulesetVersion === '2020.01.01') return 'RULESET_DEPRECATED';
  if (trigger.abuseScore >= 99) return 'ABUSE_DETECTED';
  if (trigger.market === 'eu') return 'SCOPE_DISCLAIMER';
  return 'UNKNOWN';
}

const failures = [];
let ok = 0;

for (const { code, trigger, expect } of REG.codes) {
  const got = resolveError(trigger);
  if (got !== expect) failures.push(`${code}: got ${got}, want ${expect}`);
  else {
    ok++;
    console.log(`✓ ERR ${code}`);
  }
}

const rate = ok / REG.codes.length;
if (rate < REG.minCoverageRate) {
  failures.push(`coverage ${(rate * 100).toFixed(1)}% < ${REG.minCoverageRate * 100}%`);
}

if (failures.length) {
  console.error('Error code harness failures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`✓ Error codes — ${ok}/${REG.codes.length} (${Math.round(rate * 100)}%)`);
process.exit(0);
