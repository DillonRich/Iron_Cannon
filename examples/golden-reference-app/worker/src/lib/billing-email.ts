import type { Env } from '../index';

/** M16-billing-emails */
export async function sendBillingEmail(env: Env, userId: string): Promise<void> {
  const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>();
  if (!user?.email) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `bill:${userId}`,
    },
    body: JSON.stringify({
      from: 'Iron Cannon Demo <billing@resend.dev>',
      to: [user.email],
      template_id: 'billing.subscription_active',
    }),
  });
}
