/**
 * Resume path R01–R15 — planning-phase resolver (SESSION_RESUME_PROTOCOL §8).
 */
export function resolveResume(trigger = {}) {
  if (trigger.mode === 'CONTINUE_BUILD' && !trigger.stateLogExists) return 'RESUME_NO_STATE_LOG';
  if (trigger.stateLogCorrupt) return 'RESUME_STATE_LOG_CORRUPT';
  if (trigger.stackDrift || trigger.hashDrift) return 'RESUME_DRIFT_DETECTED';
  if (trigger.wiremapApproved === false) return 'RESUME_WIREMAP_UNAPPROVED';
  if (trigger.moduleCompleteWithoutVerify) return 'RESUME_MODULE_GAP';
  if (trigger.sessionAgeDays >= 90) return 'RESUME_STALE_RULESET';
  if (trigger.sessionTier && trigger.apiKeyTier && trigger.sessionTier !== trigger.apiKeyTier) {
    return 'RESUME_TIER_CHANGED';
  }
  if (trigger.phaseJump && !trigger.attestation) return 'RESUME_ATTESTATION_REQUIRED';
  if (trigger.mode === 'SECURITY_ONLY' && trigger.tier === 'armor') return 'OK_RESUME_MODULE';
  if (trigger.mode === 'SECURITY_ONLY' && trigger.tier === 'pro') return 'TIER_INSUFFICIENT';
  if (trigger.mode === 'COMPLIANCE_ONLY' && trigger.tier === 'armor') return 'TIER_INSUFFICIENT';
  if (trigger.mode === 'COMPLIANCE_ONLY' && trigger.tier === 'iron_clad') return 'OK_COMPLIANCE_ONLY';
  if (trigger.mode === 'IRON_CLAD_FULL_AUDIT' && trigger.tier === 'iron_clad') return 'OK_IRON_CLAD_AUDIT';
  if (trigger.mode === 'FRESH' && !trigger.stateLogExists) return 'OK_FULL_PATH';
  if (trigger.mode === 'CONTINUE_BUILD' && trigger.cleanDiff) return 'OK_RESUME_MODULE';
  if (trigger.cloneWithStateLog) return 'OK_RESUME_MENU';
  if (trigger.sessionMissing && trigger.stateLogExists) return 'OK_REBUILD_SESSION';
  if (trigger.tierDowngrade) return 'OK_L4_BLOCKED';
  return 'UNKNOWN_RESUME';
}
