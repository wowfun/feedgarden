import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser';
import { z } from 'zod';
import { defaultStorageRoot } from './storage-paths.js';

const slug = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/);
const channelFields = {
  id: slug,
  enabled: z.boolean().default(true),
  transport: z.enum(['fetch', 'curl']).default('fetch'),
  limit: z.number().int().positive().max(2000).default(500).describe('Maximum items for hn-api and arxiv-api. Other channel kinds use their feed window or adapter-specific bounds.'),
  authTokenEnv: z.string().default('TWITTER_AUTH_TOKEN'),
  csrfTokenEnv: z.string().default('TWITTER_CT0'),
};
export const channelSchema = z.discriminatedUnion('kind', [
  z.object({ ...channelFields, kind: z.literal('podcast-rss'), url: z.url(), podcastName: z.string().min(1) }).strict(),
  z.object({ ...channelFields, kind: z.enum(['hn-api', 'feed', 'sitemap', 'anthropic-html', 'github-trending', 'github-search', 'x-cli', 'follow-builders', 'arxiv-api', 'ph-html']), url: z.url().optional() }).strict(),
]);
export const sourceSchema = z.object({
  id: slug, name: z.string().min(1), enabled: z.boolean().default(true),
  timezone: z.string().default('Asia/Shanghai').refine(value => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }, 'Invalid IANA timezone'),
  intervalHours: z.number().positive(),
  streams: z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9_.-]+$/), channels: z.array(channelSchema).min(1) }).strict()).min(1),
  includeKeywords: z.array(z.string().min(2)).default([]),
  selection: z.object({
    method: z.enum(['hn-engagement', 'reddit-rss-percentile']),
    dailyLimit: z.number().int().min(1).max(2000).default(50),
    updateDays: z.number().int().min(1).max(30).default(7),
  }).strict().optional(),
  agent: z.object({ model: z.string().trim().min(1).optional(), effort: z.string().trim().min(1).optional() }).strict().optional(),
}).strict();
const agentFields = {
  command: z.string().min(1).optional(), args: z.array(z.string()).default(['acp']),
  inheritEnvironment: z.array(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)).default([]).describe('Additional parent environment variable names explicitly passed to agent processes. Values stay outside configuration.'),
  effort: z.string().trim().min(1).optional(),
  version: z.string().min(1).optional(), timeoutSeconds: z.number().positive().max(300).default(300),
  maxBatchItems: z.number().int().min(1).max(10).default(10), maxInputChars: z.number().int().min(4000).max(24000).default(24000),
  maxItemChars: z.number().int().min(100).max(4000).default(4000), maxDailyCalls: z.number().int().positive().max(80).default(80),
  workspaceRetentionDays: z.number().int().min(0).max(365).default(7),
  maxTranscriptChunks: z.number().int().min(1).max(1024).default(64),
};
const agentObjectError: z.core.$ZodErrorMap = issue => issue.code === 'unrecognized_keys' && issue.keys.includes('runtimeDirectory')
  ? 'agent.runtimeDirectory was removed; agent workspaces are derived from storage.root' : undefined;
export const agentSchema = z.union([
  z.object({ ...agentFields, backend: z.literal('opencode').default('opencode'), model: z.string().trim().min(1).optional() }, { error: agentObjectError }).strict(),
  z.object({ ...agentFields, backend: z.literal('dsh'), model: z.string({ error: 'DSH requires an explicit model' }).trim().min(1) }, { error: agentObjectError }).strict(),
]);
export const configSchema = z.object({
  $schema: z.string().optional(), version: z.literal(2),
  storage: z.object({ root: z.string().trim().min(1).default(defaultStorageRoot) }, {
    error: issue => issue.code === 'unrecognized_keys'
      ? `Unsupported storage settings: ${issue.keys.map(key => 'storage.' + key).join(', ')}. Use storage.root; all private paths are derived from it` : undefined,
  }).strict().default({ root: defaultStorageRoot }),
  feed: z.object({ directory: z.string().default('content'), topics: z.string().default('config/topics.json') }).strict().default({ directory: 'content', topics: 'config/topics.json' }),
  collection: z.object({ backfillDays: z.number().int().min(0).max(30).default(7), enrichmentRefreshDays: z.number().int().min(0).max(30).default(7) }).strict().default({ backfillDays: 7, enrichmentRefreshDays: 7 }),
  agent: agentSchema,
  publish: z.object({ repository: z.string().default('https://github.com/wowfun/feedgarden.git'), branch: z.string().default('main'), auto: z.boolean().default(false) }).strict().default({ repository: 'https://github.com/wowfun/feedgarden.git', branch: 'main', auto: false }),
  sources: z.array(sourceSchema).min(1),
}).strict().superRefine((config, context) => {
  const seen = new Set<string>();
  for (const source of config.sources) {
    if (source.selection && source.id !== (source.selection.method === 'hn-engagement' ? 'hackernews' : 'reddit')) context.addIssue({ code: 'custom', message: `Selection method does not match source: ${source.id}` });
    if (seen.has(source.id)) context.addIssue({ code: 'custom', message: `Duplicate source: ${source.id}` });
    seen.add(source.id);
    const streams = new Set<string>();
    for (const stream of source.streams) {
      if (source.id !== 'podcast' && stream.channels.some(channel => channel.kind === 'podcast-rss')) context.addIssue({ code: 'custom', message: 'podcast-rss requires the built-in podcast source ID' });
      if (streams.has(stream.id)) context.addIssue({ code: 'custom', message: `Duplicate stream: ${source.id}/${stream.id}` });
      streams.add(stream.id);
      if (new Set(stream.channels.map(channel => channel.id)).size !== stream.channels.length) context.addIssue({ code: 'custom', message: `Duplicate channel: ${source.id}/${stream.id}` });
    }
  }
});
export type Config = z.infer<typeof configSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type Stream = Source['streams'][number];
export function resolveConfigFile(file?: string): string {
  if (!file && existsSync('feedgarden.json') && existsSync('feedgarden.jsonc')) throw new Error('Both JSON and JSONC exist; use --config');
  return resolve(file ?? (existsSync('feedgarden.jsonc') ? 'feedgarden.jsonc' : 'feedgarden.json'));
}
export function readConfig(file?: string): unknown {
  file = resolveConfigFile(file);
  const errors: ParseError[] = [];
  const value = parse(readFileSync(resolve(file), 'utf8'), errors, { allowTrailingComma: file.endsWith('.jsonc'), disallowComments: !file.endsWith('.jsonc') });
  if (errors.length) throw new Error(errors.map(error => `${printParseErrorCode(error.error)} at ${error.offset}`).join('; '));
  return value;
}
export function loadConfig(file?: string): Config { return configSchema.parse(readConfig(file)); }
