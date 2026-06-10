/**
 * Stripe platform billing webhooks (Iron Cannon subscriptions).
 * User-app M12 webhooks are separate.
 */

const DEFAULT_TOLERANCE_SEC = 300;

function parseStripeSignature(header) {
  const parts = {};
  for (const piece of header.split(',')) {
    const eq = piece.indexOf('=');
    if (eq === -1) continue;
    parts[piece.slice(0, eq).trim()] = piece.slice(eq + 1);
  }
  const v1 = header
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));
  return { timestamp: parts.t, signatures: v1 };
}

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Verify Stripe-Signature header (Web Crypto — Workers compatible). */
export async function verifyStripeWebhookSignature(payload, signatureHeader, secret, toleranceSec = DEFAULT_TOLERANCE_SEC) {
  if (!signatureHeader || !secret) return { ok: false, error: 'AUTH_MISSING' };
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || !signatures.length) return { ok: false, error: 'AUTH_INVALID', message: 'Malformed stripe-signature' };

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (Number.isFinite(age) && Math.abs(age) > toleranceSec) {
    return { ok: false, error: 'AUTH_INVALID', message: 'Timestamp outside tolerance' };
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`));
  const expected = hex(mac);
  const match = signatures.some((s) => timingSafeEqual(s, expected));
  if (!match) return { ok: false, error: 'AUTH_INVALID', message: 'Signature mismatch' };
  return { ok: true };
}

function tierFromStripeSubscription(obj) {
  const meta = obj?.metadata ?? {};
  const tier = (meta.tier ?? meta.ironcannon_tier ?? 'pro').toLowerCase();
  if (['pro', 'armor', 'ironclad'].includes(tier)) return tier;
  return 'pro';
}

function mapStripeStatus(status) {
  const allowed = ['active', 'trialing', 'past_due', 'canceled', 'inactive'];
  return allowed.includes(status) ? status : 'inactive';
}

/** Idempotent event insert; returns true if new. */
async function recordStripeEvent(d1, eventId, type) {
  if (!d1?.prepare) return true;
  try {
    const existing = await d1.prepare('SELECT event_id FROM stripe_platform_events WHERE event_id = ?').bind(eventId).first();
    if (existing) return false;
    await d1
      .prepare('INSERT INTO stripe_platform_events (event_id, type) VALUES (?, ?)')
      .bind(eventId, type)
      .run();
    return true;
  } catch {
    return true;
  }
}

async function upsertSubscription(d1, { userId, stripeSubscriptionId, tier, status }) {
  if (!d1?.prepare || !userId) return;
  const st = mapStripeStatus(status);
  await d1
    .prepare(
      `INSERT INTO subscriptions (user_id, stripe_subscription_id, tier, status, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         stripe_subscription_id = excluded.stripe_subscription_id,
         tier = excluded.tier,
         status = excluded.status,
         updated_at = datetime('now')`,
    )
    .bind(userId, stripeSubscriptionId ?? null, tier, st)
    .run();
}

async function revokeUserKeys(d1, userId) {
  if (!d1?.prepare || !userId) return;
  await d1
    .prepare(`UPDATE api_keys SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL`)
    .bind(userId)
    .run();
}

/**
 * Process platform Stripe event JSON (post-verify).
 */
export async function processStripePlatformEvent(event, d1) {
  const type = event?.type;
  const obj = event?.data?.object ?? {};
  const eventId = event?.id ?? `evt_${type}`;

  const isNew = await recordStripeEvent(d1, eventId, type);
  if (!isNew) return { ok: true, duplicate: true, type, eventId };

  switch (type) {
    case 'checkout.session.completed': {
      const userId = obj.client_reference_id ?? obj.metadata?.user_id ?? obj.customer;
      const tier = (obj.metadata?.tier ?? 'pro').toLowerCase();
      if (userId) {
        await upsertSubscription(d1, {
          userId,
          stripeSubscriptionId: obj.subscription ?? null,
          tier,
          status: 'active',
        });
      }
      return { ok: true, type, userId, tier, action: 'checkout_completed' };
    }
    case 'customer.subscription.updated': {
      const userId = obj.metadata?.user_id ?? obj.customer;
      const tier = tierFromStripeSubscription(obj);
      await upsertSubscription(d1, {
        userId,
        stripeSubscriptionId: obj.id,
        tier,
        status: obj.status ?? 'active',
      });
      return { ok: true, type, userId, tier, status: obj.status };
    }
    case 'customer.subscription.deleted': {
      const userId = obj.metadata?.user_id ?? obj.customer;
      await upsertSubscription(d1, {
        userId,
        stripeSubscriptionId: obj.id,
        tier: tierFromStripeSubscription(obj),
        status: 'canceled',
      });
      await revokeUserKeys(d1, userId);
      return { ok: true, type, userId, action: 'subscription_canceled' };
    }
    case 'invoice.payment_failed': {
      const userId = obj.metadata?.user_id ?? obj.customer;
      await upsertSubscription(d1, {
        userId,
        stripeSubscriptionId: obj.subscription ?? null,
        tier: 'pro',
        status: 'past_due',
      });
      return { ok: true, type, userId, status: 'past_due' };
    }
    default:
      return { ok: true, type, ignored: true };
  }
}

export async function handleStripePlatformWebhookRequest(request, env) {
  const secret = env?.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return {
      status: 501,
      body: {
        ok: false,
        error: 'NOT_CONFIGURED',
        message: 'STRIPE_WEBHOOK_SECRET not set — see MANUAL_SETUP_BLOCKERS.md',
      },
    };
  }

  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');
  const verified = await verifyStripeWebhookSignature(payload, sig, secret);
  if (!verified.ok) {
    return { status: 400, body: verified };
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return { status: 400, body: { ok: false, error: 'ENGINE_SCHEMA_FAILURE', message: 'Invalid JSON' } };
  }

  const result = await processStripePlatformEvent(event, env?.DB);
  return { status: 200, body: { ok: true, ...result } };
}
