import type { Env } from '../index';

/** M40-deletion-api */
export async function handleDeletion(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'POST' && url.pathname === '/api/account/delete') {
    const body = (await request.json()) as { userId?: string };
    const userId = body.userId ?? '';
    const graceEnds = new Date(Date.now() + 7 * 86400000).toISOString();
    await env.DB.prepare(
      'INSERT INTO deletion_requests (user_id, deletion_status, grace_ends_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET deletion_status=excluded.deletion_status',
    )
      .bind(userId, 'scheduled', graceEnds)
      .run();
    return Response.json({ ok: true, deletion_status: 'scheduled', grace_ends_at: graceEnds });
  }
  if (request.method === 'POST' && url.pathname === '/api/account/delete-cancel') {
    const body = (await request.json()) as { userId?: string };
    await env.DB.prepare('DELETE FROM deletion_requests WHERE user_id = ?').bind(body.userId ?? '').run();
    return Response.json({ ok: true, cancelled: true });
  }
  return Response.json({ error: 'not_found' }, { status: 404 });
}
