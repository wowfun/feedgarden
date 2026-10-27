import { resolve } from 'node:path';
import type { Config } from '../src/config.js';
import { storagePaths } from '../src/storage-paths.js';

// Keep reusable validation commands independent of dated investigation notes.
// A review can direct all artifacts into its own evidence folder through this env.
export function validationDirectory(config: Pick<Config, 'storage'>): string {
  return process.env.FEEDGARDEN_VALIDATION_DIR === undefined
    ? storagePaths(config.storage).validation
    : resolve(process.env.FEEDGARDEN_VALIDATION_DIR);
}
