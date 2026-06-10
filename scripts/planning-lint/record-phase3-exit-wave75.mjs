#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/knowledge-expansion-track.json');
const track = JSON.parse(readFileSync(path, 'utf8'));
track.phase3Status = 'complete';
track.phase3ExitDate = '2026-06-06';
track.phase3ExitWave = 75;
track.phase4BlockedUntil = 'stakeholder PRODUCTION_READINESS_SIGNOFF witness';
writeFileSync(path, JSON.stringify(track, null, 2) + '\n');
console.log('✓ Phase 3 exit recorded — wave 75 planning gates met');
