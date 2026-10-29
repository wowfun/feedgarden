import { z } from 'zod';
export const candidateSchema = z.object({ model: z.string().trim().min(1), effort: z.string().trim().min(1).optional(), account: z.string().min(1).default('default'), maxDailyCalls: z.number().int().positive().default(80) }).strict();
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
  id: slug.regex(/^(?!clippings$)/, 'clippings is reserved for authored content'), name: z.string().min(1), enabled: z.boolean().default(true),
  timezone: z.string().default('Asia/Shanghai').refine(value => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }, 'Invalid IANA timezone'),
  intervalHours: z.number().positive(),
  processAfter: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).default('06:00'),
  streams: z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9_.-]+$/), enabled: z.boolean().default(true), routes: z.array(channelSchema).min(1) }).strict()).min(1),
  includeKeywords: z.array(z.string().min(2)).default([]),
  selection: z.object({
    method: z.enum(['hn-engagement', 'reddit-rss-percentile']),
    dailyLimit: z.number().int().min(1).max(2000).default(50),
    updateDays: z.number().int().min(1).max(30).default(7),
  }).strict().optional(),
  agent: z.object({ model: z.string().trim().min(1).optional(), effort: z.string().trim().min(1).optional(), candidates: z.array(candidateSchema).optional() }).strict().optional(),
}).strict();
const agentFields = {
  candidates: z.array(candidateSchema).default([]), account: z.string().min(1).default('default'),
  command: z.string().min(1).optional(), args: z.array(z.string()).default(['acp']),
  inheritEnvironment: z.array(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)).default([]).describe('Additional parent environment variable names explicitly passed to agent processes. Values stay outside configuration.'),
  effort: z.string().trim().min(1).optional(),
  version: z.string().min(1).optional(), timeoutSeconds: z.number().positive().max(300).default(300),
  maxBatchItems: z.number().int().min(1).max(10).default(10), maxInputChars: z.number().int().min(4000).max(24000).default(24000),
  maxItemChars: z.number().int().min(100).max(4000).default(4000), maxDailyCalls: z.number().int().positive().default(80),
  workspaceRetentionDays: z.number().int().min(0).max(365).default(7),
  maxTranscriptChunks: z.number().int().min(1).max(1024).default(64),
};
const agentObjectError: z.core.$ZodErrorMap = issue => issue.code === 'unrecognized_keys' && issue.keys.includes('runtimeDirectory')
  ? 'agent.runtimeDirectory was removed; agent workspaces are derived from storage.dataDir' : undefined;
export const agentSchema = z.union([
  z.object({ ...agentFields, backend: z.literal('opencode').default('opencode'), model: z.string().trim().min(1).optional() }, { error: agentObjectError }).strict(),
  z.object({ ...agentFields, backend: z.literal('dsh'), model: z.string({ error: 'DSH requires an explicit model' }).trim().min(1) }, { error: agentObjectError }).strict(),
]);
export const targetSchema = z.object({
  id: slug, repository: z.string().min(1), branch: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_./-]*$/).default('main'),
  format: z.enum(['json', 'markdown', 'jekyll']).default('markdown'), managedPrefix: z.string().default('feed'),
  auxiliaryFiles: z.array(z.string()).default([]), output: z.string().optional(),
  ui: z.object({
    title: z.string().min(1).max(200).optional(), description: z.string().max(1000).optional(), lang: z.enum(['en', 'zh-CN']).optional(),
    url: z.url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'UI URL must use HTTP(S)').optional(),
    baseurl: z.string().regex(/^(?:\/[a-zA-Z0-9_/-]*)?$/).optional(),
    features: z.object({ search: z.boolean().optional(), feed: z.boolean().optional(), tags: z.boolean().optional(), graph: z.boolean().optional(), relations: z.boolean().optional(), previews: z.boolean().optional(), outline: z.boolean().optional(), favorites: z.boolean().optional() }).strict().optional(),
  }).strict().optional(),
}).strict().superRefine((target, ctx) => {
  for (const path of [target.managedPrefix, ...target.auxiliaryFiles]) {
    if (!path || path === '.' || path.startsWith('/') || /[:\\]/.test(path) || path.split('/').some(part => ['..', '.', '.git', ''].includes(part))) ctx.addIssue({ code: 'custom', message: 'Target paths must be non-root portable relative paths' });
  }
  if (target.branch.includes('..') || target.branch.endsWith('/') || target.branch.includes('@{')) ctx.addIssue({ code: 'custom', message: 'Invalid branch' });
});
export const configSchema = z.object({
  $schema: z.string().optional(), version: z.literal(3), instanceId: z.uuid(),
  storage: z.object({ dataDir: z.string().trim().min(1).optional() }).strict().default({}),
  timezone: z.string().default('Asia/Shanghai').refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }),
  observedDays: z.number().int().min(1).max(30).default(7),
  targets: z.array(targetSchema).default([]),
  feed: z.object({ directory: z.string().default('content'), topics: z.string().default('config/topics.json'), locales: z.string().optional() }).strict().default({ directory: 'content', topics: 'config/topics.json' }),
  collection: z.object({ backfillDays: z.number().int().min(0).max(30).default(7), enrichmentRefreshDays: z.number().int().min(0).max(30).default(7) }).strict().default({ backfillDays: 7, enrichmentRefreshDays: 7 }),
  agent: agentSchema,
  sources: z.array(sourceSchema),
}).strict().superRefine((config, context) => {
  if (new Set(config.targets.map(target => target.id)).size !== config.targets.length) context.addIssue({ code: 'custom', message: 'Duplicate target ID' });
  const seen = new Set<string>();
  for (const source of config.sources) {
    if (source.selection && source.id !== (source.selection.method === 'hn-engagement' ? 'hackernews' : 'reddit')) context.addIssue({ code: 'custom', message: `Selection method does not match source: ${source.id}` });
    if (seen.has(source.id)) context.addIssue({ code: 'custom', message: `Duplicate source: ${source.id}` });
    seen.add(source.id);
    const streams = new Set<string>();
    for (const stream of source.streams) {
      if (source.id !== 'podcast' && stream.routes.some(channel => channel.kind === 'podcast-rss')) context.addIssue({ code: 'custom', message: 'podcast-rss requires the built-in podcast source ID' });
      if (streams.has(stream.id)) context.addIssue({ code: 'custom', message: `Duplicate stream: ${source.id}/${stream.id}` });
      streams.add(stream.id);
      if (new Set(stream.routes.map(channel => channel.id)).size !== stream.routes.length) context.addIssue({ code: 'custom', message: `Duplicate channel: ${source.id}/${stream.id}` });
    }
  }
});
export type Config = z.infer<typeof configSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type Stream = Source['streams'][number];
