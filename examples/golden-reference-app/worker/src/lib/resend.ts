import type { Env } from '../index';

/** M03-auth-resend-emails */
export async function sendAuthEmail(env: Env, to: string, templateId: string): Promise<void> {
  const idempotencyKey = `auth:${to}:${templateId}`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: 'Iron Cannon Demo <onboarding@resend.dev>',
      to: [to],
      template_id: templateId,
    }),
  });
}
