#!/usr/bin/env node
/** Mark Phase 3 expand+test loop entry in knowledge expansion track */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const path = join(ROOT, 'docs/engine/planning/knowledge-expansion-track.json');
const track = JSON.parse(readFileSync(path, 'utf8'));
track.phase = 3;
track.phaseLabel = 'Expand + test loops toward production MCP';
track.phase3Entry = '2026-06-06';
track.phase3Gate = 'g2:production-confidence';
writeFileSync(path, JSON.stringify(track, null, 2) + '\n');
console.log('✓ Phase 3 entry recorded — expand+test loop active');
