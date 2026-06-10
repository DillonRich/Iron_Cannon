/** @ironcannon/verify — stack + module compliance checks */

export function validateStackCompleteness(stack) {
  const missing = [];
  if (!stack?.supported && stack?.supported !== undefined) {
    missing.push('stack_not_supported');
  }
  if ((stack?.missingConfig?.length ?? 0) > 0) {
    missing.push(...stack.missingConfig);
  }
  if (stack?.deps?.firebase) missing.push('unsupported_firebase');
  const complete =
    stack?.supported !== false && missing.length === 0 && (stack?.conflicts?.length ?? 0) === 0;
  return { complete, missing, warnings: stack?.warnings ?? [] };
}

export function validateModulePatterns(spec, detectedPatternIds = []) {
  const required = spec?.patternsUnderTest ?? [];
  const missing = required.filter((p) => !detectedPatternIds.includes(p));
  return {
    ok: missing.length === 0,
    missing,
    tested: required.length,
  };
}
