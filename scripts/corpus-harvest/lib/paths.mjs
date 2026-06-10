import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

export const PATHS = {
  root: ROOT,
  registry: join(ROOT, 'docs/corpus/SOURCE_REGISTRY.json'),
  inventory: join(ROOT, 'harvest-data/inventory'),
  queue: join(ROOT, 'harvest-data/harvest-queue.json'),
  state: join(ROOT, 'harvest-data/harvest-state.json'),
  raw: join(ROOT, 'harvest-data/raw'),
  drafts: join(ROOT, 'harvest-data/drafts'),
  review: join(ROOT, 'harvest-data/review/harvest-review.csv'),
  coverage: join(ROOT, 'harvest-data/corpus-coverage.json'),
  references: join(ROOT, 'docs/engine/specimens/references'),
  priorityRules: join(ROOT, 'scripts/corpus-harvest/priority-rules'),
};
