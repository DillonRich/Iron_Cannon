# Iron Cannon

**An MCP-powered compliance copilot for SaaS stacks** — especially Next.js / Cloudflare Workers + D1 + Stripe + Resend.

Iron Cannon gives AI agents (and humans) a structured audit workflow: detect the stack, generate a module wiremap, ship implementation directives, verify code patterns, and gate production / infrastructure / legal readiness. It runs **locally** as a Cloudflare Worker dev server and exposes tools over the [Model Context Protocol](https://modelcontextprotocol.io/) (HTTP JSON-RPC).

> **Portfolio note:** This project was dogfooded on real Cloudflare + Stripe apps but is **paused before production SaaS launch**. It is a strong demonstration of MCP tool design, rules engines, and agent guardrails — not a hosted compliance certification product.

---

## What it does

| Tier | Tools | Purpose |
|------|-------|---------|
| **Pro** | T01–T08 | Stack discovery, wiremap, module directives, snippet verification, drift & recovery |
| **Armor** | T09–T11 | Security surfaces, infra checklists (cache, rate limits, stress testing) |
| **IronClad** | T12–T14 | Legal obligation map + spot-check verification |

**Design philosophy:** Iron Cannon is two modes in one product:

- **Copilot** — rich checklists and sequencing (high trust)
- **Judge** — pass/fail gates only after deliberate code snippets and verified modules (medium trust)

---

## Architecture

```
┌─────────────────┐     HTTP /mcp      ┌──────────────────────┐
│  Cursor / CLI   │ ◄──────────────► │  apps/mcp-worker     │
│  (MCP client)   │   JSON-RPC 2.0   │  (Cloudflare Worker) │
└─────────────────┘                  └──────────┬───────────┘
                                                │
                                     ┌──────────▼───────────┐
                                     │  @ironcannon/mcp-core │
                                     │  T01–T14 tool runtime │
                                     └──────────┬───────────┘
                                                │
              ┌─────────────────────────────────┼─────────────────────────┐
              │                                 │                         │
     @ironcannon/compose              @ironcannon/compare          @ironcannon/verify
     (tier redaction)                 (pattern matching)           (stack completeness)
```

**Rules engine data** lives under `docs/engine/` as JSON specimens (fixtures, obligations, catalogs). `npm run build:worker-bundle` packs them into `packages/mcp-core/src/generated/` for the Worker.

---

## Quick start (local MCP)

### Prerequisites

- Node.js 20+
- npm

### 1. Install & build

```bash
git clone <your-repo-url>
cd iron-cannon-workspace
npm install
npm run build:worker-bundle
```

### 2. Verify the engine

```bash
npm run g2:audit          # package + smoke tests (HTTP optional)
npm run portfolio:preflight   # scan for accidental live secrets
```

### 3. Start the MCP server

```bash
npm run ironcannon:serve
```

Server listens at **http://127.0.0.1:8787** (`/health`, `/mcp`, `/tools`).

### 4. Connect Cursor (or any MCP client)

Copy `mcp-config.example.json` into your Cursor MCP settings and adjust paths per [Cursor docs](https://docs.cursor.com/context/mcp). Use **one server URL** with different `x-ironcannon-tier` headers (`pro`, `armor`, `ironclad`).

Toggle the MCP server off/on after starting `ironcannon:serve`.

---

## CLI workflows

```bash
# Audit an external project (T01–T03 local, prints wiremapAttestation)
npm run ironcannon -- audit "C:/path/to/your-app"

# Golden path smoke (reference app)
npm run ironcannon -- ref-stack
npm run ironcannon -- ref-golden

# Full tiered harness (Pro → Armor → IronClad)
npm run ironcannon -- full

# Dogfood bundle: audit + fixture regression + MCP envelope test
npm run ironcannon:dogfood -- "C:/path/to/your-app"

# Single module verify
npm run ironcannon -- verify M12-stripe-webhook ./path/to/snippet.ts
```

Set tier: `IRON_CANNON_TIER=armor npm run ironcannon -- ...`

---

## Agent workflow (summary)

1. **T01** `analyze_project_stack` — detect frontend, compute, DB, Stripe/Resend
2. **T02** `validate_stack_completeness` — missing secrets / config hints
3. **T03** `generate_system_wiremap` — module chain + `wiremapAttestation` token
4. **T04** `get_module_directives` — per-module implementation guidance (+ `snippetHint` for verify-heavy modules)
5. **T05** `verify_module_compliance` — **must pass real code snippets** (`notAudited` if empty)
6. **Armor:** T09–T11 security + infrastructure gates
7. **IronClad:** T12–T14 legal obligation map (T13 optional snippet verify)

Pass `wiremapAttestation` from T03 on all T04/T05/T11 calls.

---

## Project layout

| Path | Description |
|------|-------------|
| `packages/mcp-core/` | Core MCP tool runtime (T01–T14) |
| `packages/compose/` | Tier-based response redaction |
| `packages/compare/` | Pattern / obligation compare engine |
| `packages/verify/` | Stack completeness checks |
| `apps/mcp-worker/` | Cloudflare Worker HTTP surface |
| `scripts/` | CLI (`ironcannon.mjs`), build, test harnesses |
| `docs/engine/` | Rules JSON, fixtures, obligation index (not markdown) |
| `examples/golden-reference-app/` | Minimal reference stack for T01–T05 |

---

## Testing

```bash
npm run g2:audit                 # recommended smoke gate
npm run planning:guardian-retest # pattern equivalence fixtures
npm run g2:golden-full           # full Pro + Armor + IronClad path
npm run planning:user-journey    # 121 behavioral scenarios (slower)
```

---

## Known limitations (honest)

- **Stack coverage** is strongest for Cloudflare Workers/Pages + Stripe + Resend — not universal.
- **T05 / T11 judge mode** requires deliberate snippets and `verifiedModules` — not unattended certification.
- **Hosted deploy** (Cloudflare production, D1 platform DB, Vectorize) is scaffolded but not required for local MCP.
- **Legal (IronClad)** outputs checklists and heuristics — not legal advice.

---

## Security

See [SECURITY.md](SECURITY.md). Dev-only API keys in `docs/engine/phase1/fixtures/api-keys.dev.json` are fake local tokens (`ic_dev_*`). Do not commit real `.env` files.

---

## License

GNU AGPL v3 — see [LICENSE](LICENSE). You may run this locally for audits and contribute improvements; if you offer this software as a network service, AGPL copyleft applies.

---

## Author

Built as a portfolio project demonstrating MCP server design, structured agent guardrails, and compliance-oriented tooling for modern SaaS infrastructure.
