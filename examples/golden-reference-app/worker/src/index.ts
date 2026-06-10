/**
 * Golden reference Worker API — M02, M03, M11, M12, M13, M16, M40
 */
import { handleAuthRoutes } from './routes/auth';
import { handleBillingRoutes } from './routes/billing';
import { handleStripeWebhook } from './routes/stripe-webhook';
import { handleProvisioning } from './routes/provisioning';
import { handleDeletion } from './routes/deletion';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  APP_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/auth')) {
      return handleAuthRoutes(request, env);
    }
    if (url.pathname === '/api/billing/checkout') {
      return handleBillingRoutes(request, env);
    }
    if (url.pathname === '/api/webhooks/stripe') {
      return handleStripeWebhook(request, env);
    }
    if (url.pathname === '/api/billing/provision') {
      return handleProvisioning(request, env);
    }
    if (url.pathname.startsWith('/api/account/delete')) {
      return handleDeletion(request, env);
    }
    return Response.json({ error: 'not_found' }, { status: 404 });
  },
};
