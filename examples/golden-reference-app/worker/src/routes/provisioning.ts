import type { Env } from '../index';

/** M13-provisioning-kv */
export async function handleProvisioning(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }
  const body = (await request.json()) as { userId?: string };
  const userId = body.userId ?? '';
  if (!userId) return Response.json({ error: 'user_required' }, { status: 400 });
  await env.KV.put(`provisioning:${userId}`, '1', { expirationTtl: 300 });
  const v = await env.KV.get(`provisioning:${userId}`);
  return Response.json({ ok: true, provisioning: v === '1' });
}
