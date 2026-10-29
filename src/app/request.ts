import { parseArgs } from 'node:util';
import { FdgError } from '../contracts/errors.js';
import type { Selection } from '../instance/index.js';
import { commands, globalOptions, positionalRanges } from './commands.js';
const stringOptions = [
  'workspace',
  'config',
  'data-dir',
  'timezone',
  'model',
  'effort',
  'source',
  'subscription',
  'since',
  'until',
  'observed-days',
  'day',
  'wait-seconds',
  'query',
  'url',
  'limit',
  'cursor',
  'target',
  'output',
  'format',
  'repository',
  'branch',
  'prefix',
  'expected-head',
  'remote-base',
  'legacy-base',
  'platform',
  'channel',
  'name',
  'max-mib',
  'port',
] as const;
const booleanOptions = [
  'text',
  'json',
  'help',
  'detach',
  'due',
  'publish',
  'fallback',
  'refresh',
  'rebuild',
  'retry-failed',
  'dry-run',
  'history',
  'save',
  'latest',
  'unfinished',
  'takeover',
  'all',
] as const;

export type StringOption = typeof stringOptions[number];
export type CommandOptions = Partial<Record<StringOption, string>> & Partial<Record<typeof booleanOptions[number], boolean>>;
export interface CommandRequest { command: string; positionals: string[]; options: CommandOptions; selection: Selection }
/** Retain a useful command name even when strict option parsing fails. */
export function commandHint(argv: string[]): string {
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i]!;
    if (value === '--') return argv[i + 1] ?? 'help';
    if (!value.startsWith('-')) return value;
    if (stringOptions.includes(value.slice(2) as StringOption) && !argv[i + 1]?.startsWith('-')) i++;
  }
  return 'help';
}
export function parseCommand(argv: string[]): CommandRequest {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: Object.fromEntries([
        ...stringOptions.map((k) => [k, { type: 'string' as const }]),
        ...booleanOptions.map((k) => [
          k,
          { type: 'boolean' as const, ...(k === 'help' ? { short: 'h' } : {}) },
        ]),
      ]),
    });
  } catch (error) {
    throw new FdgError('BAD_INPUT', error instanceof Error ? error.message.split('\n')[0]! : 'Invalid command options');
  }
  const options = parsed.values as CommandOptions,
    positionals = parsed.positionals;

  return { command: positionals[0] ?? 'help', positionals, options, selection: { workspace: options.workspace, config: options.config, dataDir: options['data-dir'] } };
}

export function validateCommand({ command, positionals, options }: CommandRequest) {
  const action = positionals[1];
  const str = (key: StringOption) => options[key];
  const number = (key: StringOption) => options[key] === undefined ? undefined : Number(options[key]);
  const known =
    commands.find((c) => c.path === positionals.slice(0, 3).join(' ')) ??
    commands.find((c) => c.path === positionals.slice(0, 2).join(' ')) ??
    commands.find((c) => c.path === command);
  if (!known && !['_worker', '_scheduled'].includes(command))
    throw new FdgError('BAD_INPUT', 'Unknown command');
  if (known) {
    const [min, max, usage] = positionalRanges[known.path] ?? [0, 0, ''],
      count = positionals.length - known.path.split(' ').length;
    if (count < min || count > max) throw new FdgError('BAD_INPUT', 'Usage: fdg ' + known.path + ' ' + usage);
    const allowed = new Set([...globalOptions, ...known.options, 'help']);
    for (const key of Object.keys(options))
      if (!allowed.has(key))
        throw new FdgError('BAD_INPUT', 'Unsupported option for ' + known.path + ': --' + key);
    if (options.format && !['json', 'markdown', 'jekyll'].includes(str('format')!))
      throw new FdgError('BAD_INPUT', '--format must be json, markdown or jekyll');
    if (options['max-mib'] && (!Number.isFinite(number('max-mib')) || number('max-mib')! <= 0))
      throw new FdgError('BAD_INPUT', '--max-mib must be positive');
    if (
      options.port &&
      (!Number.isSafeInteger(number('port')) || number('port')! < 0 || number('port')! > 65535)
    )
      throw new FdgError('BAD_INPUT', '--port must be 0–65535');
    if (
      command === 'status' &&
      ((action && (options.latest || options.unfinished)) || (options.latest && options.unfinished))
    )
      throw new FdgError('BAD_INPUT', 'Choose RUN_ID, --latest or --unfinished');
  }
  return known;
}
