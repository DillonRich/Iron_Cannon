import Stripe from 'stripe';
import type { Env } from '../index';

/** M11-stripe-checkout-route */
export async function handleBillingRoutes(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const body = (await request.json()) as { priceId?: string; userId?: string };
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: body.priceId ?? 'price_test_9usd', quantity: 1 }],
    success_url: `${env.APP_URL}/billing/success`,
    cancel_url: `${env.APP_URL}/pricing`,
    metadata: { userId: body.userId ?? '' },
  });
  return Response.json({ ok: true, url: session.url });
}
