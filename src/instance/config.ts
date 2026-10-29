import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { configSchema } from '../contracts/configuration.js';
import { FdgError } from '../contracts/errors.js';
import { createInstanceContext, type InstanceContext } from './context.js';
import { assertExportDirectory } from './output-path.js';
import { instancePaths, type Selection } from './paths.js';

export function resolveConfigFile(file?: string): string {
  return instancePaths(file ? { config: file } : {}).configFile;
}
export function readConfig(file?: string): unknown {
  file = resolveConfigFile(file);
  const errors: ParseError[] = [];
  const value = parse(readFileSync(resolve(file), 'utf8'), errors, { allowTrailingComma: file.endsWith('.jsonc'), disallowComments: !file.endsWith('.jsonc') });
  if (errors.length) throw new FdgError('CONFIG_INVALID', errors.map(error => `${printParseErrorCode(error.error)} at ${error.offset}`).join('; '));
  return value;
}
export function loadInstance(selection: Selection = {}): { config: InstanceContext; paths: ReturnType<typeof instancePaths> } {
  const initial = instancePaths(selection);
  if (!existsSync(initial.configFile)) throw new FdgError('NOT_INITIALIZED', 'Run setup for the selected instance');
  const raw = readConfig(initial.configFile) as { version?: number; feed?: { directory?: string; topics?: string } };
  if (raw.version !== 3) throw new FdgError('UPGRADE_REQUIRED', 'Run instance upgrade with an explicit workspace or config');
  const result = configSchema.safeParse(raw);
  if (!result.success) throw new FdgError('CONFIG_INVALID', result.error.message);
  const config = result.data, paths = instancePaths(selection, config.storage);
  config.feed = { directory: resolve(paths.configDir, raw.feed?.directory ?? join(paths.dataDir, 'exports', 'core')), topics: resolve(paths.configDir, raw.feed?.topics ?? join(paths.dataDir, 'topics.json')), ...(config.feed.locales ? { locales: resolve(paths.configDir, config.feed.locales) } : {}) };
  config.targets = config.targets.map(target => ({ ...target, repository: /^(?:[a-z][a-z0-9+.-]*:\/\/|[^/\\]+@[^:]+:)/i.test(target.repository) || target.repository.startsWith('-') || /^(ext|file):/i.test(target.repository) ? target.repository : resolve(paths.configDir, target.repository), ...(target.output ? { output: resolve(paths.configDir, target.output) } : {}) }));
  assertExportDirectory(paths, config.feed.directory);
  for (const target of config.targets) if (target.output) assertExportDirectory(paths, target.output);
  return { config: createInstanceContext(config, paths), paths };
}
export function loadConfig(file?: string): InstanceContext { return loadInstance(file ? { config: file } : {}).config; }
