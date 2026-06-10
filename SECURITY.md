# Security

## Secrets policy

This repository must **not** contain production API keys, Stripe live keys, webhook signing secrets, or Cloudflare account tokens.

- Use `.env` locally (gitignored). Copy from `.env.example` files where provided.
- Never commit `sk_live_*`, `whsec_*` (real values), or `CLOUDFLARE_API_TOKEN`.

## Local development API keys

The file `docs/engine/phase1/fixtures/api-keys.dev.json` contains **fake, documented dev tokens** (prefix `ic_dev_`) used only for local MCP and test harnesses. They are not production credentials and are safe to publish for local experimentation.

Example MCP config (`mcp-config.example.json`) references these dev tokens so Cursor can connect to a local server without extra setup. **Do not reuse these patterns in production.**

## Reporting

If you believe a real secret was committed, rotate the credential immediately and open an issue (or contact the maintainer privately).

## License note

This project is licensed under AGPL-3.0. Security research and responsible disclosure are welcome; redistribution must comply with the license.
