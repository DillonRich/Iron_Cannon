import { randomUUID } from 'crypto';

const buffer = [];
const pendingFlush = [];

/**
 * Best-effort usage record — memory buffer in dev; D1 immediate or deferred batch flush.
 * @param {object} opts
 * @param {boolean} [opts.defer] — buffer only; flush via flushUsageBufferToD1 (Worker cron)
 */
export async function recordToolUsage(event, opts = {}) {
  const row = {
    id: randomUUID(),
    userId: event.userId ?? event.clientId ?? 'anonymous',
    toolId: event.toolId,
    tier: event.tier ?? 'pro',
    durationMs: event.durationMs ?? 0,
    outcome: event.outcome ?? (event.ok ? 'ok' : 'error'),
    errorCode: event.errorCode ?? null,
    createdAt: new Date().toISOString(),
  };

  buffer.push(row);
  if (buffer.length > 500) buffer.shift();

  pendingFlush.push(row);
  if (pendingFlush.length > 500) pendingFlush.shift();

  const d1 = opts.d1 ?? opts.env?.DB;
  const defer = opts.defer === true;

  if (d1?.prepare && !defer) {
    const ok = await insertUsageRow(d1, row);
    if (ok) removePending(row.id);
  }

  return row;
}

function removePending(id) {
  const i = pendingFlush.findIndex((r) => r.id === id);
  if (i >= 0) pendingFlush.splice(i, 1);
}

async function insertUsageRow(d1, row) {
  try {
    await d1
      .prepare(
        'INSERT INTO usage_events (id, user_id, tool_id, tier, duration_ms, outcome, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        row.id,
        row.userId,
        row.toolId,
        row.tier,
        row.durationMs,
        row.outcome,
        row.createdAt,
      )
      .run();
    return true;
  } catch {
    return false;
  }
}

/** Batch flush pending usage rows to D1 (Worker scheduled / tests). */
export async function flushUsageBufferToD1(d1, opts = {}) {
  if (!d1?.prepare) {
    return { ok: false, error: 'NO_D1', flushed: 0, pending: pendingFlush.length };
  }

  const maxBatch = opts.maxBatch ?? 100;
  const batch = pendingFlush.splice(0, maxBatch);
  let flushed = 0;
  const failed = [];

  for (const row of batch) {
    const ok = await insertUsageRow(d1, row);
    if (ok) flushed += 1;
    else failed.push(row);
  }

  if (failed.length) pendingFlush.unshift(...failed);

  return {
    ok: failed.length === 0,
    flushed,
    failed: failed.length,
    pending: pendingFlush.length,
  };
}

export function getUsageBufferSnapshot() {
  return [...buffer];
}

export function getPendingUsageCount() {
  return pendingFlush.length;
}

export function resetUsageBufferForTests() {
  buffer.length = 0;
  pendingFlush.length = 0;
}
