#!/usr/bin/env node
/** Record TGS v2 re-baseline — trigger #3 obligations ≥120 (golden path unchanged) */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const criteriaPath = join(ROOT, 'docs/engine/TGS_V2_CRITERIA.md');
const idx = JSON.parse(
  readFileSync(join(ROOT, 'docs/engine/specimens/obligation-index.specimen.json'), 'utf8'),
);
const obligationCount = idx.obligations.length;
const TRIGGER = 3;
const MIN = 120;

if (obligationCount < MIN) {
  console.error(`TGS v2 not triggered — obligations ${obligationCount} < ${MIN}`);
  process.exit(1);
}

let criteria = readFileSync(criteriaPath, 'utf8');
criteria = criteria.replace(
  /\*\*Status:\*\* Criteria \*\*defined\*\*; TGS v1 remains active until \*\*any\*\* trigger fires\./,
  '**Status:** **TGS v2 re-baselined** (2026-06-06) — trigger #3 obligations ≥120; golden path unchanged.',
);
criteria = criteria.replace(
  /\| Obligations \| 100 \| No \(< 120\) \|/,
  `| Obligations | **${obligationCount}** | **Yes** (trigger #${TRIGGER}) |`,
);
criteria = criteria.replace(
  /\| TGS witness \| v1 approved \| \*\*Stay on v1\*\* \|/,
  '| TGS witness | v1 approved + v2 additive | **v2 re-baselined** |',
);

writeFileSync(criteriaPath, criteria, 'utf8');
console.log(`✓ TGS v2 re-baseline recorded — trigger #${TRIGGER}, obligations ${obligationCount}, golden path unchanged`);
