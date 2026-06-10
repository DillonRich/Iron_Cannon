import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { planningPath } from './repo-root.js';
import { readEngineJson, findEngineFixture } from './engine-data.js';

export function loadFixtureSpec(dirRel, fixtureId) {
  const fromBundle = findEngineFixture(dirRel, fixtureId);
  if (fromBundle) return fromBundle;

  const dir = planningPath('specimens/fixtures', dirRel);
  if (!existsSync(dir)) return null;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.fixture-spec.json')) continue;
    const spec = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (spec.fixtureId === fixtureId) return spec;
  }
  return null;
}

/** Load module fixture by id from bundle or filesystem. */
export function loadModuleFixture(moduleId) {
  const key = `specimens/fixtures/modules/${moduleId}.fixture-spec.json`;
  try {
    return readEngineJson(key);
  } catch {
    const path = planningPath('specimens/fixtures/modules', `${moduleId}.fixture-spec.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8'));
  }
}
