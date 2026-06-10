/** Detect agent throttle loops (repeated T04/T05 on same module). */
const windows = new Map();
const WINDOW_MS = 120_000;
const MAX_SAME_MODULE = 6;

export function checkThrottleLoop(clientKey, toolId, moduleId) {
  if (!moduleId || (toolId !== 'T04' && toolId !== 'T05')) return null;
  const key = `${clientKey ?? 'global'}:${moduleId}:${toolId}`;
  const now = Date.now();
  let bucket = windows.get(key);
  if (!bucket || now - bucket.start > WINDOW_MS) {
    bucket = { start: now, count: 0 };
    windows.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > MAX_SAME_MODULE) {
    return {
      ok: false,
      error: 'THROTTLE_LOOP_DETECTED',
      message: `${toolId} called ${bucket.count}× on ${moduleId} within 2m — fix root cause before retrying`,
    };
  }
  return null;
}

export function resetThrottleGuardForTests() {
  windows.clear();
}
