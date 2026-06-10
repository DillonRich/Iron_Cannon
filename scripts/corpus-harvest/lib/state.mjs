import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { PATHS } from './paths.mjs';

export function loadState() {
  if (!existsSync(PATHS.state)) {
    return { version: 1, fetched: {}, published: {}, lastRun: null };
  }
  return JSON.parse(readFileSync(PATHS.state, 'utf8'));
}

export function saveState(state) {
  mkdirSync(dirname(PATHS.state), { recursive: true });
  state.lastRun = new Date().toISOString();
  writeFileSync(PATHS.state, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

export function markFetched(state, url, meta) {
  state.fetched[url] = { ...meta, at: new Date().toISOString() };
}

export function isFetched(state, url) {
  return Boolean(state.fetched[url]);
}
