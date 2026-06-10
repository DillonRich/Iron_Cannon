import { evaluateCompare } from '@ironcannon/compare';
import { registryExactMatch, registryPrefixMatch } from './pattern-equivalence.js';

const PATTERN_RULES = [
  {
    prefix: 'STWH-001',
    test: (h) =>
      /constructevent|webhooks\.construct|verifystripesignature|stripe-signature|crypto\.subtle\.(verify|importkey)/i.test(
        h,
      ),
  },
  {
    prefix: 'STWH-002',
    test: (h) =>
      /kv\.put|idempotency|stripe_evt|stripe_events|stripe_activation|event\.id|duplicate.*event/i.test(h),
  },
  {
    prefix: 'STWH-003',
    test: (h) =>
      /checkout\.session\.completed|handlestripewebhook|switch\s*\(.*event\.type/i.test(h),
  },
  { prefix: 'CHECK-001', test: (h) => /checkout\.sessions\.create/i.test(h) },
  { prefix: 'CHECK-002', test: (h) => /subscription|mode:\s*['"]subscription/i.test(h) },
  { prefix: 'AUTH-SC-001', test: (h) => /\busers\b/i.test(h) && /create table/i.test(h) },
  { prefix: 'AUTH-SC-002', test: (h) => /\bsessions\b/i.test(h) },
  { prefix: 'AUTH-SC-003', test: (h) => /unique|primary key/i.test(h) },
  {
    prefix: 'AUTH-RT-001',
    test: (h) => /\/api\/auth\/(signup|register)|signup|register\.html|handleRegister/i.test(h),
  },
  {
    prefix: 'AUTH-RT-002',
    test: (h) => /\/api\/auth\/(signin|login)|signin|login\.html|handleLogin/i.test(h),
  },
  { prefix: 'AUTH-RT-F01', test: (h) => /math\.random|weak.*token/i.test(h) },
  { prefix: 'AUTH-RT', test: (h) => /route|\/api\/|export async function/i.test(h) },
  { prefix: 'AUTH-EM-001', test: (h) => /idempotency-key/i.test(h) },
  { prefix: 'AUTH-EM-002', test: (h) => /template_id|authorization/i.test(h) },
  { prefix: 'AUTH-EM-003', test: (h) => /resend\.com|api\.resend/i.test(h) },
  { prefix: 'AUTH-EM-F01', test: (h) => /gmail\.com|noreply@gmail/i.test(h) },
  { prefix: 'AUTH-UI-001', test: (h) => /\/terms|\/privacy|terms|privacy/i.test(h) },
  { prefix: 'AUTH-UI-002', test: (h) => /htmlfor|label.*email/i.test(h) },
  {
    prefix: 'AUTH-MW-001',
    test: (h) =>
      /middleware|nextresponse|sessioncookie|samesite|httponly|browserpaths|access-control-allow-origin/i.test(
        h,
      ),
  },
  { prefix: 'AUTH-MW-002', test: (h) => /redirect|\/login|\/dashboard/i.test(h) },
  { prefix: 'AUTH-MW-003', test: (h) => /pathname|startsWith/i.test(h) },
  { prefix: 'BILL-SC-001', test: (h) => /subscriptions/i.test(h) && /create table/i.test(h) },
  { prefix: 'BILL-SC-002', test: (h) => /stripe_subscription_id/i.test(h) },
  {
    prefix: 'PROV-001',
    test: (h) => /kv\.put|consumeipratelimit|rate.?limit|429|retry-after/i.test(h),
  },
  {
    prefix: 'PROV-002',
    test: (h) => /kv\.get|ratelimit|getauthratelimitpolicy/i.test(h),
  },
  { prefix: 'BILL-', test: (h) => /stripe|subscription|billing/i.test(h) },
  { prefix: 'STRIPE-', test: (h) => /stripe/i.test(h) },
  { prefix: 'RESEND-', test: (h) => /resend|email/i.test(h) },
  { prefix: 'SESSION-', test: (h) => /session|cookie|middleware/i.test(h) },
  { prefix: 'KV-', test: (h) => /\bkv\b|binding/i.test(h) },
  { prefix: 'PROV-', test: (h) => /provision|subscription|tier/i.test(h) },
  { prefix: 'BILL-UI-001', test: (h) => /success|billing/i.test(h) },
  { prefix: 'BILL-UI-002', test: (h) => /router\.refresh|refresh\(\)/i.test(h) },
  { prefix: 'BILL-DASH-001', test: (h) => /subscriptions|billingportal|stripe/i.test(h) },
  { prefix: 'BILL-DASH-002', test: (h) => /status|customer/i.test(h) },
  { prefix: 'BILL-EM-001', test: (h) => /template_id|idempotency-key/i.test(h) },
  { prefix: 'BILL-EM-002', test: (h) => /subscription_active|billing\./i.test(h) },
  { prefix: 'SURF-MAP-001', test: (h) => /surfaceId/i.test(h) },
  { prefix: 'SURF-MAP-002', test: (h) => /overlayModuleId/i.test(h) },
  { prefix: 'ARM-SES-001', test: (h) => /content-security-policy|csp/i.test(h) },
  { prefix: 'ARM-SES-002', test: (h) => /csrf|x-csrf-token/i.test(h) },
  { prefix: 'ARM-SES-003', test: (h) => /httponly|secure/i.test(h) },
  { prefix: 'ARM-SES-F01', test: (h) => /localstorage\.setitem\s*\(\s*['"]session/i.test(h) },
  { prefix: 'ARM-WH-001', test: (h) => /constructevent/i.test(h) },
  { prefix: 'ARM-WH-002', test: (h) => /stale|event\.created/i.test(h) },
  { prefix: 'ARM-WH-003', test: (h) => /kv\.put|stripe_evt/i.test(h) },
  { prefix: 'ARM-WH-F01', test: (h) => /json\.parse\s*\(\s*body|console\.log\s*\(\s*stripe_webhook_secret/i.test(h) },
  { prefix: 'PW-SC-001', test: (h) => /password_reset_tokens/i.test(h) },
  { prefix: 'PW-SC-F01', test: (h) => /token\s+text\s+not\s+null/i.test(h) && !/token_hash/i.test(h) },
  { prefix: 'PW-R01', test: (h) => /token_hash/i.test(h) },
  { prefix: 'PW-API-001', test: (h) => /forgot-password|forgotpassword/i.test(h) },
  { prefix: 'PW-API-002', test: (h) => /resetpassword|invalidateallsessions/i.test(h) },
  { prefix: 'PW-UI-001', test: (h) => /forgot-password|reset-password/i.test(h) },
  { prefix: 'PW-UI-002', test: (h) => /<form|action=/i.test(h) },
  { prefix: 'PW-EM-001', test: (h) => /template_id|password_reset/i.test(h) },
  { prefix: 'PW-EM-002', test: (h) => /idempotency-key/i.test(h) },
  { prefix: 'PW-EM-F01', test: (h) => /your new password is|password is abc/i.test(h) },
  { prefix: 'ONB-SC-001', test: (h) => /onboarding_completed_at/i.test(h) },
  { prefix: 'ONB-SC-002', test: (h) => /display_name/i.test(h) },
  { prefix: 'ONB-UI-', test: (h) => /onboarding|wizard/i.test(h) },
  { prefix: 'ONB-API-001', test: (h) => /acceptedterms|accepted_terms/i.test(h) },
  { prefix: 'ONB-API-002', test: (h) => /\/api\/onboarding\/complete|fetch\s*\(\s*['"]\/api\/onboarding/i.test(h) },
  { prefix: 'ONB-API-', test: (h) => /onboarding|\/api\//i.test(h) },
  { prefix: 'DEL-API-001', test: (h) => /deletion_status|deleteRequest|grace_ends_at/i.test(h) },
  { prefix: 'DEL-API-002', test: (h) => /delete-cancel|deletecancel/i.test(h) },
  { prefix: 'DEL-API-003', test: (h) => /scheduled|grace/i.test(h) },
  { prefix: 'DEL-SCH-001', test: (h) => /subscriptions\.cancel/i.test(h) },
  { prefix: 'DEL-SCH-002', test: (h) => /deleted\+|void\.local/i.test(h) },
  { prefix: 'DEL-SCH-F01', test: (h) => /delete from users/i.test(h) },
  { prefix: 'DEL-UI-001', test: (h) => /\/settings\/danger|settings\/danger/i.test(h) },
  { prefix: 'DEL-UI-002', test: (h) => /confirmemail|grace_period|data-state/i.test(h) },
  { prefix: 'DEL-UI-', test: (h) => /delete-account|deletion/i.test(h) },
  { prefix: 'EXP-API-001', test: (h) => /gdpr_export|queue\.send/i.test(h) },
  { prefix: 'EXP-API-002', test: (h) => /export_ready|jobtype/i.test(h) },
  { prefix: 'EXP-WK-001', test: (h) => /r2\.put|\.put\s*\(\s*key/i.test(h) },
  { prefix: 'EXP-WK-002', test: (h) => /signedurl|export_ready/i.test(h) },
  { prefix: 'EXP-WK-', test: (h) => /export|worker|queue/i.test(h) },
  { prefix: 'EXP-UI-001', test: (h) => /download my data|settings\/privacy/i.test(h) },
  { prefix: 'EXP-UI-002', test: (h) => /<button|privacy/i.test(h) },
  { prefix: 'EXP-UI-', test: (h) => /export|download/i.test(h) },
  { prefix: 'TR-API-001', test: (h) => /reaccept-terms|legal\/reaccept/i.test(h) },
  { prefix: 'TR-API-002', test: (h) => /terms_version|current_terms/i.test(h) },
  { prefix: 'TR-UI-001', test: (h) => /reaccept\/page|page\.tsx|acceptedterms.*checkbox/i.test(h) },
  { prefix: 'TR-UI-002', test: (h) => /acceptedterms|type=\"checkbox\"/i.test(h) },
  { prefix: 'TR-UI-', test: (h) => /terms|reaccept/i.test(h) },
  { prefix: 'PAGES-CFG-001', test: (h) => /pages_build_output_dir/i.test(h) },
  { prefix: 'PAGES-CFG-002', test: (h) => /nodejs_compat|compatibility_flags/i.test(h) },
  { prefix: 'PAGES-ENV-001', test: (h) => /NEXT_PUBLIC_API_URL/i.test(h) },
  { prefix: 'PAGES-ENV-002', test: (h) => /APP_URL|vars\s*=/i.test(h) },
  { prefix: 'SUPA-CFG-001', test: (h) => /createClient|NEXT_PUBLIC_SUPABASE_URL/i.test(h) },
  { prefix: 'SUPA-CFG-002', test: (h) => /row level security|enable row level security|rls/i.test(h) },
  { prefix: 'SUPA-MW-001', test: (h) => /createServerClient/i.test(h) && /middleware/i.test(h) },
  { prefix: 'SUPA-MW-002', test: (h) => /@supabase\/ssr/i.test(h) },
  { prefix: 'TAURI-CFG-001', test: (h) => /tauri\.conf|productname|identifier/i.test(h) },
  { prefix: 'TAURI-CFG-002', test: (h) => /csp|security/i.test(h) },
  { prefix: 'TAURI-CFG-', test: (h) => /tauri|productname/i.test(h) },
  { prefix: 'TAURI-UPD-001', test: (h) => /updater|pubkey|endpoints/i.test(h) },
  { prefix: 'TAURI-UPD-002', test: (h) => /verifysignature|signature/i.test(h) },
  { prefix: 'TAURI-', test: (h) => /tauri|updater|desktop/i.test(h) },
  { prefix: 'UI-', test: (h) => /page|component|route/i.test(h) },
  { prefix: 'EMAIL-', test: (h) => /email|resend|template/i.test(h) },
];

function isAdvisoryPattern(patternId) {
  return (
    /P49-|P50-|P52-|-$/.test(patternId) ||
    patternId.includes('P49') ||
    patternId.includes('HARDENING') ||
    patternId.includes('LIFECYCLE') ||
    patternId === 'PW-A01' ||
    patternId === 'PW-R01'
  );
}

function patternSatisfied(patternId, snippet) {
  const hay = snippet ?? '';
  const exact = registryExactMatch(patternId, hay);
  if (exact !== null) return exact;
  const rules = [...PATTERN_RULES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of rules) {
    if (patternId.startsWith(rule.prefix)) {
      return rule.test(hay);
    }
  }
  const fromPrefix = registryPrefixMatch(patternId, hay);
  if (fromPrefix !== null) return fromPrefix;
  const norm = patternId.replace(/-/g, '').toLowerCase();
  return hay.toLowerCase().includes(norm.slice(0, Math.min(10, norm.length)));
}

function corePatterns(spec) {
  return (spec.patternsUnderTest ?? []).filter((p) => !isAdvisoryPattern(p));
}

export function patternsSatisfied(spec, snippet) {
  const patterns = corePatterns(spec);
  const missing = patterns.filter((pid) => !patternSatisfied(pid, snippet));
  return { met: missing.length === 0, missing, checked: patterns.length };
}

function calibrateFixture(spec) {
  const core = corePatterns(spec);
  const passOk = core.every((p) => patternSatisfied(p, spec.passSnippet));
  let failOk;
  if (spec.forbiddenOnFail?.length) {
    failOk = spec.forbiddenOnFail.every((pid) => patternSatisfied(pid, spec.failSnippet));
  } else if (spec.missingOnFail?.length) {
    failOk = spec.missingOnFail.every((pid) => !patternSatisfied(pid, spec.failSnippet));
  } else {
    failOk = !core.every((p) => patternSatisfied(p, spec.failSnippet));
  }
  return passOk && failOk;
}

/**
 * T05 verify_module_compliance — calibrate fixture or check user snippet.
 */
export function verifyModuleCompliance(spec, snippet) {
  if (!spec) return { compliant: false, error: 'NO_SPEC' };

  if (spec.detectType) {
    const passStatus = evaluateCompare(spec.detectType, spec.passSnippet, spec.detect ?? {});
    const failStatus = evaluateCompare(spec.detectType, spec.failSnippet, spec.detect ?? {});
    const passOk = passStatus === spec.expectedPass;
    const failOk = failStatus === spec.expectedFail;
    if (snippet) {
      const userStatus = evaluateCompare(spec.detectType, snippet, spec.detect ?? {});
      return {
        compliant: userStatus === 'met' || userStatus === true,
        mode: 'detectType',
        userStatus,
        patterns: spec.patternsUnderTest,
      };
    }
    return {
      compliant: passOk && failOk,
      mode: 'detectType-calibration',
      passStatus,
      failStatus,
    };
  }

  if (snippet) {
    const userResult = patternsSatisfied(spec, snippet);
    return {
      compliant: userResult.met,
      mode: 'snippet',
      missing: userResult.missing,
      patterns: spec.patternsUnderTest,
    };
  }

  const compliant = calibrateFixture(spec);
  const passResult = patternsSatisfied(spec, spec.passSnippet);
  const failResult = patternsSatisfied(spec, spec.failSnippet);
  return {
    compliant,
    mode: 'calibration',
    passMet: passResult.met,
    failMet: failResult.met,
    missingOnPass: passResult.missing,
    missingOnFail: failResult.missing,
  };
}
