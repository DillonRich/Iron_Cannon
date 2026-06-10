import type { Env } from '../index';
import { sendAuthEmail } from '../lib/resend';

/** M02-auth-worker-routes */
export async function handleAuthRoutes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return Response.json({ error: 'email_required' }, { status: 400 });
    const userId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(userId, body.email).run();
    await sendAuthEmail(env, body.email, 'auth.verify_email');
    return Response.json({ ok: true, userId });
  }
  if (request.method === 'POST' && url.pathname === '/api/auth/signin') {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return Response.json({ error: 'email_required' }, { status: 400 });
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
    if (!user) return Response.json({ error: 'not_found' }, { status: 404 });
    const sessionId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime("now", "+7 days"))')
      .bind(sessionId, (user as { id: string }).id)
      .run();
    return Response.json({ ok: true, sessionId });
  }
  if (request.method === 'GET' && url.pathname === '/api/me') {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const row = await env.DB.prepare(
      'SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?',
    )
      .bind(sessionId)
      .first();
    if (!row) return Response.json({ error: 'unauthorized' }, { status: 401 });
    return Response.json({ ok: true, user: row });
  }
  return Response.json({ error: 'method_not_allowed' }, { status: 405 });
}
