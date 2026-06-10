#!/usr/bin/env node
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REF_DIR = join(ROOT, 'docs/engine/specimens/references');
const LAUNCH_TARGET = 220;
const MIN_RATE = 0.9;

const count = readdirSync(REF_DIR).filter((f) => f.endsWith('.specimen.json')).length;
const required = Math.ceil(LAUNCH_TARGET * MIN_RATE);
if (count < required) {
  console.error(`Corpus launch: ${count}/${LAUNCH_TARGET} (${((count / LAUNCH_TARGET) * 100).toFixed(1)}%) < ${MIN_RATE * 100}% (${required} required)`);
  process.exit(1);
}
console.log(`✓ Corpus launch — ${count}/${LAUNCH_TARGET} (${((count / LAUNCH_TARGET) * 100).toFixed(1)}%)`);
process.exit(0);
