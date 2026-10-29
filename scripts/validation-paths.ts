import { resolve } from 'node:path';
import type { InstanceContext as Config } from '../src/instance/index.js';
import { createInstanceContext,instancePaths } from '../src/instance/index.js';


// Keep reusable validation commands independent of dated investigation notes.
// A review can direct all artifacts into its own evidence folder through this env.
export function validationDirectory(config: Pick<Config, 'paths'>): string {
  return process.env.FEEDGARDEN_VALIDATION_DIR === undefined
    ? config.paths.validation
    : resolve(process.env.FEEDGARDEN_VALIDATION_DIR);
}

export function validationContext(config:import('../src/contracts/configuration.js').Config){const base=resolve(config.storage.dataDir??'.local/validation');return createInstanceContext(config,instancePaths({workspace:base,dataDir:base}));}
