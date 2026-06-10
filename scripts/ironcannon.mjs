#!/usr/bin/env node
/**
 * Iron Cannon local CLI — runs mcp-core without Worker deploy.
 * Usage: npm run ironcannon -- golden | stack | wiremap | module M12 | verify M12 [file]
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { invokeTool } from '../packages/mcp-core/src/index.js';
import { issueWiremapAttestation } from '../packages/mcp-core/src/wiremap-attestation.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF_APP = join(REPO_ROOT, 'examples/golden-reference-app');

const argv = process.argv.slice(2);
const writeStateLog = argv.includes('--write-state-log');
const optionalFlowsIdx = argv.indexOf('--optional-flows');
const optionalFlowArg = optionalFlowsIdx >= 0 ? argv[optionalFlowsIdx + 1] : null;
const optionalFlows = optionalFlowArg
  ? optionalFlowArg.split(',').map((s) => s.trim()).filter(Boolean)
  : [];
const flagValues = optionalFlowArg ? [optionalFlowArg] : [];
const positional = argv.filter((a) => !a.startsWith('--') && !flagValues.includes(a));
const cmd = positional[0];
const arg = positional[1];
const file = positional[2];
const tier = process.env.IRON_CANNON_TIER ?? 'pro';

async function main() {
  switch (cmd) {
    case 'stack':
    case 't01': {
      const r = await invokeTool('T01', { fixtureId: arg ?? 'SD-01', tier });
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case 'ref-stack':
    case 'ref-t01': {
      const r = await invokeTool('T01', { projectPath: REF_APP, tier });
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case 'audit':
    case 'stack-audit': {
      const projectPath = arg ?? process.env.IRON_CANNON_PROJECT_PATH;
      if (!projectPath) {
        console.error('Usage: npm run ironcannon -- audit "C:/path/to/your-app"');
        console.error('  or:  IRON_CANNON_PROJECT_PATH="..." npm run ironcannon -- audit');
        process.exit(1);
      }
      if (!existsSync(projectPath)) {
        console.error(`Project path not found: ${projectPath}`);
        process.exit(1);
      }
      const t01 = await invokeTool('T01', { projectPath, tier, clientKey: 'audit-cli' });
      const t02 = await invokeTool('T02', { stack: t01.stack, tier, clientKey: 'audit-cli' });
      const flowIds = ['auth-lifecycle', 'billing-subscription', ...optionalFlows];
      const t03 = await invokeTool('T03', {
        tier,
        clientKey: 'audit-cli',
        stackId: t01.stack?.stackId,
        flowIds,
        wiremapProfile:
          t01.stack?.stackId === 'tauri-desktop'
            ? 'tauri-desktop'
            : t01.stack?.stackId === 'SD-06'
              ? 'pages-worker-split'
              : undefined,
      });
      const modules = t03.wiremaps?.[0]?.moduleIds ?? [];
      console.log('Iron Cannon project audit (local T01–T03)');
      console.log(`Path: ${projectPath}`);
      console.log(`Stack supported: ${t01.stack?.supported} · complete: ${t02.complete}`);
      console.log(
        `Detect: frontend=${t01.stack?.frontend} compute=${t01.stack?.compute} database=${t01.stack?.database}`,
      );
      if (t01.stack?.services?.length) console.log(`Services: ${t01.stack.services.join(', ')}`);
      if (t01.stack?.warnings?.length) console.log(`Warnings: ${t01.stack.warnings.join(', ')}`);
      if (t02.missing?.length) console.log(`Missing: ${t02.missing.join(', ')}`);
      console.log(`Wiremap modules: ${modules.length}`);
      console.log(`Attestation token: ${t03.wiremapAttestation?.token?.slice(0, 12)}…`);
      console.log('\n--- attestation chooser ---');
      console.log('| Variant | When to use | Modules |');
      console.log('| Primary | Core auth + billing wiremap | ' + modules.join(', ') + ' |');
      if (t01.stack?.stackId === 'tauri-desktop') {
        console.log('| Desktop | Tauri + core detected (SD-TD) | M80/M81 + core |');
      }
      if (t03.split && t03.wiremaps?.[1]) {
        console.log('| Split optional | After core complete — M20–M42 flows | ' + (t03.wiremaps[1].moduleIds ?? []).join(', ') + ' |');
      } else if (optionalFlows.length) {
        console.log('| Note | Optional flows requested but wiremap not split — may be merged or profile-specific | ' + optionalFlows.join(', ') + ' |');
      }
      console.log('\n--- wiremapAttestation (pass to MCP T04/T05) ---');
      console.log(JSON.stringify(t03.wiremapAttestation, null, 2));
      console.log('\n--- stack (pass to MCP T02 if needed) ---');
      console.log(JSON.stringify(t01.stack, null, 2));
      if (t02.completenessHints?.length) {
        console.log('\n--- T02 completenessHints ---');
        console.log(JSON.stringify(t02.completenessHints, null, 2));
      }
      if (t03.split && t03.wiremaps?.[1]) {
        const splitAtt = issueWiremapAttestation({
          wiremaps: [t03.wiremaps[1]],
          split: true,
        });
        console.log('\n--- splitWiremapAttestation (optional M20–M42) ---');
        console.log(JSON.stringify(splitAtt, null, 2));
      }
      if (writeStateLog) {
        const icDir = join(projectPath, '.iron_cannon');
        mkdirSync(icDir, { recursive: true });
        const lines = [
          '# Iron Cannon state_log',
          '',
          `> Generated ${new Date().toISOString()} — paste module hashes after T05 verify.`,
          '',
          `**Project:** ${projectPath}`,
          `**Stack:** ${t01.stack?.stackId ?? 'default'} · supported=${t01.stack?.supported}`,
          '',
          ...modules.map(
            (id) =>
              `### ${id}\n| status | pending |\n| verified | false |\n**fileHashes:**\n- (add path: sha256 after T05 snippet pass)\n`,
          ),
        ];
        const statePath = join(icDir, 'state_log.md');
        writeFileSync(statePath, lines.join('\n'), 'utf8');
        console.log(`\n--- state_log ---\nWrote ${statePath}`);
      }
      console.log('\n--- agent starter (paste into Cursor) ---');
      console.log(
        'Use iron-cannon-local MCP. Pass wiremapAttestation above. Always verify_module_compliance with REAL snippets.',
      );
      if (!t01.ok || !t03.wiremapAttestation?.token) process.exit(1);
      break;
    }
    case 'ref-golden': {
      const { spawnSync } = await import('child_process');
      const r = spawnSync('node', ['scripts/planning-lint/simulate-reference-app-golden-path.mjs'], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        shell: true,
      });
      process.exit(r.status ?? 0);
      break;
    }
    case 'wiremap':
    case 't03': {
      const r = await invokeTool('T03', { tier });
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case 'module':
    case 't04': {
      const completed = process.env.IRON_CANNON_COMPLETED?.split(',').filter(Boolean) ?? [];
      let att = null;
      if (process.env.IRON_CANNON_WIREMAP_ATT) {
        att = JSON.parse(process.env.IRON_CANNON_WIREMAP_ATT);
      } else {
        const t03 = await invokeTool('T03', { tier });
        att = t03.wiremapAttestation;
      }
      const r = await invokeTool('T04', {
        moduleId: arg ?? 'M01-auth-d1-schema',
        tier,
        completedModules: completed,
        wiremapAttestation: att,
      });
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case 'verify':
    case 't05': {
      const snippet = file ? readFileSync(file, 'utf8') : undefined;
      const r = await invokeTool('T05', {
        moduleId: arg ?? 'M12-stripe-webhook',
        tier,
        snippet,
      });
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case 'full':
    case 'golden-full': {
      const { spawnSync } = await import('child_process');
      const r = spawnSync('node', ['scripts/g2-golden-full.mjs'], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        shell: true,
      });
      process.exit(r.status ?? 0);
      break;
    }
    case 'golden': {
      const t01 = await invokeTool('T01', { fixtureId: 'SD-01', tier });
      const t02 = await invokeTool('T02', { stack: t01.stack, tier });
      const t03 = await invokeTool('T03', { tier });
      const att = t03.wiremapAttestation;
      const ids = t03.wiremaps?.[0]?.moduleIds ?? [];
      const completed = [];
      console.log('T01 supported:', t01.stack?.supported);
      console.log('T02 complete:', t02.complete);
      console.log('T03 modules:', ids.length, 'attestation:', att?.token?.slice(0, 8));
      for (const moduleId of ids) {
        const t04 = await invokeTool('T04', {
          moduleId,
          tier,
          completedModules: [...completed],
          wiremapAttestation: att,
        });
        if (!t04.ok) {
          console.log(`✗ ${moduleId} T04 ${t04.error}`);
          process.exit(1);
        }
        const t05 = await invokeTool('T05', { moduleId, tier, wiremapAttestation: att });
        if (!t05.compliant) {
          console.log(`✗ ${moduleId} T05`);
          process.exit(1);
        }
        const rag = t04.meta?.retrieval?.refs?.length ?? 0;
        console.log(`✓ ${moduleId} (rag:${rag})`);
        completed.push(moduleId);
      }
      console.log(`Golden path complete — ${completed.length} modules`);
      break;
    }
    case 'dogfood':
    case 'dogfood-live': {
      const { spawnSync } = await import('child_process');
      const r = spawnSync('node', ['scripts/planning-lint/simulate-dogfood-live.mjs'], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        shell: true,
      });
      process.exit(r.status ?? 0);
      break;
    }
    case 'serve': {
      const { spawnSync } = await import('child_process');
      const { join, dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      const root = join(dirname(fileURLToPath(import.meta.url)), '..');
      const r = spawnSync('node', ['scripts/ironcannon-serve.mjs'], {
        cwd: root,
        stdio: 'inherit',
        shell: true,
      });
      process.exit(r.status ?? 0);
      break;
    }
    case 'legal':
    case 't12': {
      const markets = (process.env.IRON_CANNON_MARKETS ?? 'us').split(',');
      const r = await invokeTool('T12', {
        tier: tier === 'pro' || tier === 'armor' ? 'ironclad' : tier,
        primaryMarkets: markets,
      });
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case 'legal-report':
    case 'obligations': {
      const markets = (process.env.IRON_CANNON_MARKETS ?? 'us,eu').split(',').filter(Boolean);
      const t12 = await invokeTool('T12', {
        tier: 'ironclad',
        primaryMarkets: markets,
      });
      if (!t12.ok) {
        console.error(t12);
        process.exit(1);
      }
      const required = (t12.obligations ?? []).filter((o) => o.severity === 'required' || !o.severity);
      const byCat = {};
      for (const o of required) {
        byCat[o.category] = (byCat[o.category] ?? 0) + 1;
      }
      console.log(`Iron Cannon legal obligation report`);
      console.log(`Markets: ${markets.join(', ')}`);
      console.log(`Total obligations: ${t12.obligationCount} · Required: ${required.length}`);
      console.log('By category:', JSON.stringify(byCat));
      console.log('\nRequired checklist (use T13 per id, T14 to audit):');
      for (const o of required.slice(0, 40)) {
        console.log(`  ${o.id}  ${o.category}  ${o.title}`);
      }
      if (required.length > 40) console.log(`  … +${required.length - 40} more`);
      console.log(`\n${t12.legalDisclaimer}`);
      break;
    }
    case 'infra':
    case 't11-infra': {
      const t10 = await invokeTool('T10', {
        tier: tier === 'pro' ? 'armor' : tier,
        domainId: arg ?? 'INFRA-CAPACITY',
        expectedUsers: Number(process.env.IRON_CANNON_EXPECTED_USERS) || undefined,
        expectedRps: Number(process.env.IRON_CANNON_EXPECTED_RPS) || undefined,
      });
      console.log(JSON.stringify(t10, null, 2));
      break;
    }
    case 'status': {
      const { getRulesetVersion } = await import('../packages/mcp-core/src/ruleset.js');
      const {
        getUsageBufferSnapshot,
        getPendingUsageCount,
      } = await import('../packages/mcp-core/src/usage-telemetry.js');
      const { listToolsForTier } = await import('../packages/mcp-core/src/tool-catalog.js');
      const bundle = join(REPO_ROOT, 'packages/mcp-core/src/generated/engine-bundle.json');
      const manifest = join(REPO_ROOT, 'harvest-data/vectorize-manifest.json');
      console.log(
        JSON.stringify(
          {
            rulesetVersion: getRulesetVersion(),
            tier,
            tools: listToolsForTier(tier).length,
            pendingUsageFlush: getPendingUsageCount(),
            recentUsage: getUsageBufferSnapshot().slice(-5),
            cloudflare: {
              workerBundle: existsSync(bundle),
              vectorizeManifest: existsSync(manifest),
              apiTokenSet: !!process.env.CLOUDFLARE_API_TOKEN,
              accountIdSet: !!process.env.CLOUDFLARE_ACCOUNT_ID,
            },
          },
          null,
          2,
        ),
      );
      break;
    }
    case 'deploy-check': {
      const { spawnSync } = await import('child_process');
      const checks = [
        {
          id: 'engine-bundle',
          ok: existsSync(join(REPO_ROOT, 'packages/mcp-core/src/generated/engine-bundle.json')),
          hint: 'npm run build:worker-bundle',
        },
        {
          id: 'openapi',
          ok: existsSync(join(REPO_ROOT, 'docs/engine/openapi/iron-cannon-mcp.openapi.json')),
          hint: 'npm run g2:openapi',
        },
        {
          id: 'vectorize-manifest',
          ok: existsSync(join(REPO_ROOT, 'harvest-data/vectorize-manifest.json')),
          hint: 'npm run harvest:vectorize-manifest',
        },
        {
          id: 'd1-schema',
          ok: existsSync(join(REPO_ROOT, 'docs/engine/platform/d1/001_initial.sql')),
          hint: 'docs/engine/PLATFORM_D1_SETUP.md',
        },
      ];
      const wr = spawnSync('wrangler', ['whoami'], { encoding: 'utf8', shell: true });
      checks.push({
        id: 'wrangler-auth',
        ok: wr.status === 0,
        hint: wr.status === 0 ? 'logged in' : 'wrangler login',
      });
      const cfCreds = !!process.env.CLOUDFLARE_API_TOKEN && !!process.env.CLOUDFLARE_ACCOUNT_ID;
      checks.push({
        id: 'vectorize-creds',
        ok: cfCreds,
        hint: cfCreds ? 'ready for harvest:vectorize-upsert' : 'set CLOUDFLARE_* env vars',
      });
      for (const c of checks) {
        console.log(`${c.ok ? '✓' : '○'} ${c.id}${c.hint ? ` — ${c.hint}` : ''}`);
      }
      const ready = checks.filter((c) => c.id !== 'vectorize-creds' && c.id !== 'wrangler-auth').every((c) => c.ok);
      console.log(
        ready
          ? '\nLocal ship-ready artifacts OK. See docs/engine/OPERATOR_DEPLOY_READINESS.md then CLOUDFLARE_ONBOARDING_CHECKLIST.md to go live.'
          : '\nSome local artifacts missing — run hints above.',
      );
      process.exit(ready ? 0 : 1);
      break;
    }
    case 'calibrate':
    case 'obligation': {
      const { readEngineJson } = await import('../packages/mcp-core/src/engine-data.js');
      const {
        runObligationCalibrationSuite,
        calibrateObligationEntry,
      } = await import('../packages/mcp-core/src/obligation-calibrate.js');
      if (!arg) {
        const { total, failures } = runObligationCalibrationSuite();
        console.log(`Calibration: ${total - failures.length}/${total} pass`);
        if (failures.length) {
          console.log(failures.slice(0, 15).map((f) => `${f.obligationId} pass=${f.passOk} fail=${f.failOk}`).join('\n'));
          process.exit(1);
        }
        break;
      }
      const idx = readEngineJson('specimens/obligation-index.specimen.json');
      const ob = idx.obligations.find((o) => o.id === arg);
      if (!ob) {
        console.error('Unknown obligation', arg);
        process.exit(1);
      }
      const cal = readEngineJson('specimens/fixtures/obligation-calibration/calibration.bundle.json');
      const entry = cal.entries.find((e) => e.obligationId === arg);
      if (!entry) {
        console.error('No calibration entry for', arg);
        process.exit(1);
      }
      const r = calibrateObligationEntry(entry, ob);
      console.log(JSON.stringify(r, null, 2));
      process.exit(r.ok ? 0 : 1);
      break;
    }
    case 'playbook': {
      const pb = join(REPO_ROOT, 'docs/engine/GOLDEN_AGENT_PLAYBOOK.md');
      if (existsSync(pb)) {
        console.log(readFileSync(pb, 'utf8'));
      } else {
        console.log(`Playbook not found: ${pb}`);
        process.exit(1);
      }
      break;
    }
    case 'tools': {
      const { listToolsForTier } = await import('../packages/mcp-core/src/tool-catalog.js');
      console.log(JSON.stringify(listToolsForTier(tier), null, 2));
      break;
    }
    default:
      console.log(`Iron Cannon CLI

  npm run ironcannon -- golden
  npm run ironcannon -- full          # Pro + Armor + IronClad (g2:golden-full)
  npm run ironcannon -- stack [SD-01]
  npm run ironcannon -- ref-stack       # T01 on examples/golden-reference-app
  npm run ironcannon -- audit "C:/path/to/your-app"   # T01→T03 on any project
  npm run ironcannon -- ref-golden      # full T01→T05 on reference app code
  npm run ironcannon -- wiremap
  npm run ironcannon -- module M12-stripe-webhook
  npm run ironcannon -- verify M12-stripe-webhook [path/to/code.ts]
  npm run ironcannon -- serve
  npm run ironcannon -- infra [INFRA-CACHE]
  npm run ironcannon -- legal
  npm run ironcannon -- legal-report  # human-readable T12 summary
  npm run ironcannon -- playbook
  npm run ironcannon -- status
  npm run ironcannon -- deploy-check
  npm run ironcannon -- calibrate [LEG-EMAIL-002]
  npm run ironcannon -- tools

  See docs/engine/GOLDEN_AGENT_PLAYBOOK.md
  Cloudflare timing: docs/engine/CLOUDFLARE_PRODUCTIVITY_GATE.md

  IRON_CANNON_TIER=armor npm run ironcannon -- tools
`);
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
