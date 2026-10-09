import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser';
import { z } from 'zod';

const slug = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/);
export const channelSchema = z.object({
  id: slug,
  kind: z.enum(['hn-api', 'feed', 'sitemap', 'anthropic-html', 'github-trending', 'github-search', 'x-cli', 'follow-builders', 'arxiv-api', 'ph-html']),
  enabled: z.boolean().default(true),
  url: z.url().optional(),
  transport: z.enum(['fetch', 'curl']).default('fetch'),
  limit: z.number().int().positive().max(2000).default(500),
  authTokenEnv: z.string().default('TWITTER_AUTH_TOKEN'),
  csrfTokenEnv: z.string().default('TWITTER_CT0'),
}).strict();
export const sourceSchema = z.object({
  id: slug, name: z.string().min(1), enabled: z.boolean().default(true),
  timezone: z.string().default('Asia/Shanghai').refine(value => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }, 'Invalid IANA timezone'),
  intervalHours: z.number().positive(),
  streams: z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9_.-]+$/), channels: z.array(channelSchema).min(1) }).strict()).min(1),
  includeKeywords: z.array(z.string().min(2)).default([]),
  agent: z.object({ model: z.string().optional(), effort: z.string().optional() }).strict().optional(),
}).strict();
export const configSchema = z.object({
  $schema: z.string().optional(), version: z.literal(2),
  storage: z.object({ database: z.string().default('.local/feedgarden.sqlite'), directory: z.string().default('.local') }).strict().default({ database: '.local/feedgarden.sqlite', directory: '.local' }),
  feed: z.object({ directory: z.string().default('content'), topics: z.string().default('config/topics.json') }).strict().default({ directory: 'content', topics: 'config/topics.json' }),
  collection: z.object({ backfillDays: z.number().int().min(0).max(30).default(7) }).strict().default({ backfillDays: 7 }),
  agent: z.object({ command: z.string().default('dsh'), model: z.string().min(1), effort: z.string().optional(),
    version: z.string().default('0.1.7-rc.2'), timeoutSeconds: z.number().positive().max(300).default(300),
    maxBatchItems: z.number().int().min(1).max(10).default(10), maxInputChars: z.number().int().min(4000).max(24000).default(24000),
    maxItemChars: z.number().int().min(100).max(4000).default(4000), maxDailyCalls: z.number().int().positive().max(80).default(80),
    runtimeDirectory: z.string().default('.local/dsh'),
  }).strict(),
  publish: z.object({ repository: z.string().default('https://github.com/wowfun/feedgarden.git'), branch: z.string().default('main'), auto: z.boolean().default(false) }).strict().default({ repository: 'https://github.com/wowfun/feedgarden.git', branch: 'main', auto: false }),
  sources: z.array(sourceSchema).min(1),
}).strict().superRefine((config, context) => {
  const seen = new Set<string>();
  for (const source of config.sources) {
    if (seen.has(source.id)) context.addIssue({ code: 'custom', message: `Duplicate source: ${source.id}` });
    seen.add(source.id);
    const streams = new Set<string>();
    for (const stream of source.streams) {
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
export function loadConfig(file?: string): Config {
  if (!file && existsSync('feedgarden.json') && existsSync('feedgarden.jsonc')) throw new Error('Both JSON and JSONC exist; use --config');
  file ??= existsSync('feedgarden.jsonc') ? 'feedgarden.jsonc' : 'feedgarden.json';
  const errors: ParseError[] = [];
  const value = parse(readFileSync(resolve(file), 'utf8'), errors, { allowTrailingComma: file.endsWith('.jsonc'), disallowComments: !file.endsWith('.jsonc') });
  if (errors.length) throw new Error(errors.map(error => `${printParseErrorCode(error.error)} at ${error.offset}`).join('; '));
  return configSchema.parse(value);
}
