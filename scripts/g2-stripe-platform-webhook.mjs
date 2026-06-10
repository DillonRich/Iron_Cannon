#!/usr/bin/env node
import { createHmac } from 'crypto';
import {
  verifyStripeWebhookSignature,
  processStripePlatformEvent,
} from '../packages/mcp-core/src/stripe-platform.js';

function stripeSig(payload, secret) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return { header: `t=${t},v1=${v1}`, t };
}

const secret = 'whsec_test_platform';
const payload = JSON.stringify({
  id: 'evt_test_sub',
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: 'sub_123',
      customer: 'cus_abc',
      status: 'active',
      metadata: { user_id: 'user-1', tier: 'armor' },
    },
  },
});

const bad = await verifyStripeWebhookSignature(payload, 't=1,v1=deadbeef', secret);
if (bad.ok) {
  console.error('expected bad signature to fail');
  process.exit(1);
}

const { header } = stripeSig(payload, secret);
const good = await verifyStripeWebhookSignature(payload, header, secret);
if (!good.ok) {
  console.error('signature verify failed', good);
  process.exit(1);
}

const d1calls = [];
const d1 = {
  prepare: (sql) => ({
    bind: (...args) => ({
      first: async () => {
        d1calls.push({ sql, args, op: 'first' });
        if (sql.includes('stripe_platform_events')) return null;
        if (sql.includes('subscriptions')) return null;
        return null;
      },
      run: async () => {
        d1calls.push({ sql, args, op: 'run' });
        return { success: true };
      },
    }),
  }),
};

const r = await processStripePlatformEvent(JSON.parse(payload), d1);
if (!r.ok || r.tier !== 'armor') {
  console.error('process event', r);
  process.exit(1);
}

const dup = await processStripePlatformEvent(JSON.parse(payload), {
  prepare: () => ({
    bind: () => ({
      first: async () => ({ event_id: 'evt_test_sub' }),
      run: async () => ({}),
    }),
  }),
});
if (!dup.duplicate) {
  console.error('expected duplicate event');
  process.exit(1);
}

console.log('✓ g2-stripe-platform-webhook — signature + D1 subscription update + idempotency');
process.exit(0);
