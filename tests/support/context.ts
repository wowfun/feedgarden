import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { configSchema } from '../../src/contracts/configuration.js';
import { configuration,createInstanceContext,instancePaths,type InstanceContext } from '../../src/instance/index.js';
/** Test callers explicitly select an isolated instance, including fixtures with no storage configuration. */
export function testContext(input:unknown):InstanceContext {
  const value=input&&typeof input==='object'&&'paths' in input?configuration(input as InstanceContext):input;
  const config=configSchema.parse(value),root=resolve(config.storage.dataDir??join(tmpdir(),'fdg-context-'+randomUUID()));
  return {...createInstanceContext(config,instancePaths({workspace:root,dataDir:root}))};
}
