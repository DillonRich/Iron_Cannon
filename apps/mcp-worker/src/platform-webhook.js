/**
 * Stripe platform billing webhook — delegates to @ironcannon/mcp-core.
 */
import { handleStripePlatformWebhookRequest } from '@ironcannon/mcp-core/stripe-platform';

export async function handleStripePlatformWebhook(request, env) {
  const { status, body } = await handleStripePlatformWebhookRequest(request, env);
  return Response.json(body, { status });
}
