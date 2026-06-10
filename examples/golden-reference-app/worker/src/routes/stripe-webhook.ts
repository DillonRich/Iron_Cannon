import Stripe from 'stripe';
import type { Env } from '../index';
import { sendBillingEmail } from '../lib/billing-email';

/** M12-stripe-webhook */
export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const sig = request.headers.get('stripe-signature') ?? '';
  const body = await request.text();
  const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (event.type === 'checkout.session.completed') {
    const seen = await env.KV.get(`stripe_evt:${event.id}`);
    if (seen) return Response.json({ ok: true, duplicate: true });
    await env.KV.put(`stripe_evt:${event.id}`, '1', { expirationTtl: 86400 });
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId ?? '';
    if (userId) {
      await env.DB.prepare(
        'INSERT INTO subscriptions (id, user_id, status, stripe_subscription_id) VALUES (?, ?, ?, ?)',
      )
        .bind(crypto.randomUUID(), userId, 'active', session.subscription as string)
        .run();
      await sendBillingEmail(env, userId);
    }
  }
  return Response.json({ received: true });
}
