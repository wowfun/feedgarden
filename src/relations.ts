import { agentRuntime } from './storage-paths.js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { agentIdentity, resolveAgent, configuredAgent, type AgentResolver, type ResolvedAgent } from './agent.js';
import type { Config } from './config.js';
import { Store } from './store.js';
import { fixedTask, type TaskGenerator } from './fixed-tasks.js';
import { hash, safeUrl, nowIso, errorText } from './util.js';
import { reportTaskSkill } from './report-skill.js';

const WINDOW = 72 * 3600_000;
export interface Publication { path: string; title: string; text: string; url: string; date: number; hash: string }
interface Verdict { id: string; verdict: string; reason: string; evidence: [string, string] }
interface Pair { id: string; texts: [string, string]; left: Publication; right: Publication; score: number }
export interface RecommendationManifest { version: 1; items: Record<string, { path: string; expires_at: string }[]> }
export function recentPublication(date: string | number, at = nowIso()): boolean {
  const value = typeof date === 'number' ? date : Date.parse(date), now = Date.parse(at);
  return Number.isFinite(value) && value <= now && value > now - WINDOW;
}
export function publication(path: string, markdown: string, at = nowIso()): Publication | undefined {
  if (!path.endsWith('.md') || path.split('/').some(part => part.startsWith('_') || part.startsWith('.'))) return;
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!front) return;
  try {
    const fields = parse(front[1]!);
    if (!fields || fields.publish !== true || fields.content_type !== 'post' || typeof fields.title !== 'string') return;
    const date = Date.parse(fields.date);
    if (!recentPublication(date, at)) return;
    const body = markdown.slice(front[0].length).split(/\n## (?:Media|媒体)\r?\n/)[0]!;
    const text = (fields.title + '\n' + (fields.description ?? '') + '\n' + body).normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, 4000);
    const url = typeof fields.source_url === 'string' ? safeUrl(fields.source_url) : '';
    return { path, title: fields.title, text, url, date, hash: hash({ text, date, url }) };
  } catch { /* Malformed retained archives remain opaque, not model inputs. */ }
}
export async function publications(root: string, at = nowIso()): Promise<Publication[]> {
  const posts: Publication[] = [];
  async function walk(dir: string, prefix = ''): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(e => { if (e.code === 'ENOENT') return []; throw e; })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const path = prefix + entry.name;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) { await walk(join(dir, entry.name), path + '/'); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const post = publication(path, await readFile(join(dir, entry.name), 'utf8'), at);
      if (post) posts.push(post);
    }
  }
  await walk(root); return posts.sort((a, b) => a.path.localeCompare(b.path));
}

function grams(text: string): Set<string> {
  const chars = [...text.normalize('NFKC').toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[^\p{L}\p{N}]/gu, '')];
  return new Set(chars.slice(1).map((c, i) => chars[i]! + c));
}
export function candidatePairs(posts: Publication[]): Pair[] {
  const sets = new Map(posts.map(post => [post.path, grams(post.title + ' ' + post.text.slice(0, 600))]));
  const postings = new Map<string, number[]>();
  posts.forEach((post, index) => {
    for (const gram of sets.get(post.path)!) {
      const indices = postings.get(gram);
      if (indices) indices.push(index); else postings.set(gram, [index]);
    }
  });
  type Candidate = { target: Publication; score: number };
  const top: Candidate[][] = posts.map(() => []);
  const order = (a: Candidate, b: Candidate) => b.score - a.score || b.target.date - a.target.date || a.target.path.localeCompare(b.target.path);
  function retain(source: number, target: number, score: number): void {
    const candidates = top[source]!, candidate = { target: posts[target]!, score };
    if (candidates.length < 8 || order(candidate, candidates.at(-1)!) < 0) {
      candidates.push(candidate); candidates.sort(order);
      if (candidates.length > 8) candidates.pop();
    }
  }
  const counts = new Uint32Array(posts.length);
  for (let i = 0; i < posts.length; i++) {
    const source = posts[i]!, a = sets.get(source.path)!, touched: number[] = [];
    // Postings are ordered by article index. Count each unordered intersection
    // once, skipping pairs with no shared grams, then update both top-eight lists.
    for (const gram of a) {
      const indices = postings.get(gram)!;
      for (let offset = indices.length - 1; offset >= 0; offset--) {
        const j = indices[offset]!;
        if (j <= i) break;
        const common = counts[j]!;
        if (!common) touched.push(j);
        counts[j] = common + 1;
      }
    }
    for (const j of touched) {
      const common = counts[j]!, target = posts[j]!;
      counts[j] = 0;
      if (source.path === target.path || source.url && target.url === source.url) continue;
      const score = common / Math.max(1, Math.min(a.size, sets.get(target.path)!.size));
      if (common < 3 || score < 0.01) continue;
      retain(i, j, score); retain(j, i, score);
    }
  }
  const pairs = new Map<string, Pair>();
  posts.forEach((source, index) => {
    for (const { target, score } of top[index]!) {
      const [left, right] = [source, target].sort((a, b) => a.path.localeCompare(b.path)) as [Publication, Publication];
      const id = hash({ paths: [left.path, right.path], hashes: [left.hash, right.hash] });
      pairs.set(id, { id, left, right, texts: [left.text, right.text], score });
    }
  });
  // Spend the shared budget on the strongest candidates before weak new matches.
  return [...pairs.values()].sort((a, b) => b.score - a.score || Math.max(b.left.date, b.right.date) - Math.max(a.left.date, a.right.date) || a.id.localeCompare(b.id));
}

export async function relate(config: Config, store: Store, options: { signal?: AbortSignal; retryFailed?: boolean; generator?: TaskGenerator; resolveAgent?: AgentResolver; at?: string } = {}): Promise<{ candidates: number; judged: number; pending: number; deferred: boolean; configurationError?: string }> {
  const at = options.at ?? nowIso();
  options.signal?.throwIfAborted(); store.assertLease();
  const candidates = candidatePairs(await publications(config.feed.directory, at));
  options.signal?.throwIfAborted(); store.assertLease();
  if (!candidates.length) return { candidates: 0, judged: 0, pending: 0, deferred: false };
  let agent: ResolvedAgent;
  try { agent = await (options.resolveAgent ?? (options.generator ? configuredAgent : resolveAgent))(agentRuntime(config), options.signal); }
  catch (error) {
    options.signal?.throwIfAborted(); store.assertLease();
    return { candidates: candidates.length, judged: 0, pending: candidates.length, deferred: false, configurationError: errorText(error) };
  }
  options.signal?.throwIfAborted(); store.assertLease();
  const policy = hash({ revision: 1, ...agentIdentity(agent), skill: await reportTaskSkill('relations') });
  const resolvedCandidates = candidates.map(pair => ({ ...pair, id: hash({ input: pair.id, policy }) }));
  store.setMeta('relation_policy', policy);
  const known = new Set((store.statement('SELECT key FROM feed_relation_pairs WHERE expires_at>?').all(at) as { key: string }[]).map(row => row.key));
  const pending = resolvedCandidates.filter(pair => !known.has(pair.id));
  const judgedIds = new Set<string>();
  const fixedNow = options.at ? Date.parse(options.at) : undefined;
  const active = (pair: Pair) => Math.min(pair.left.date, pair.right.date) + WINDOW > (fixedNow ?? Date.now());
  let judged = 0, deferred = false;
  for (let i = 0; i < pending.length;) {
    options.signal?.throwIfAborted();
    const batch: Pair[] = [];
    while (i < pending.length && batch.length < config.agent.maxBatchItems) {
      const candidate = pending[i]!;
      if (!active(candidate)) { i++; continue; }
      const input = { pairs: [...batch, candidate].map(p => ({ id: p.id, texts: p.texts })) };
      if (JSON.stringify(input).length > config.agent.maxInputChars) {
        if (!batch.length) throw new Error('Relation pair exceeds input budget');
        break;
      }
      batch.push(candidate); i++;
    }
    if (!batch.length) continue;
    const task = await fixedTask(store, agent, 'relations', { pairs: batch.map(p => ({ id: p.id, texts: p.texts })) }, options);
    if (task.state === 'deferred') { deferred = true; break; }
    if (!task.output) continue;
    const output = task.output as { pairs: Verdict[] };
    store.assertLease();
    store.db.transaction(() => {
      output.pairs.forEach((verdict, index) => {
        const pair = batch[index]!;
        store.statement('INSERT OR REPLACE INTO feed_relation_pairs VALUES (?,?,?,?,?,?,?)').run(pair.id, pair.left.path, pair.right.path, pair.left.hash, pair.right.hash, JSON.stringify({ ...verdict, policy }), new Date(Math.min(pair.left.date, pair.right.date) + WINDOW).toISOString());
        judgedIds.add(pair.id);
      });
    })();
    judged += batch.length;
  }
  return { candidates: candidates.length, judged, pending: pending.filter(pair => !judgedIds.has(pair.id) && active(pair)).length, deferred };
}

export interface RelationRow { key: string; left_path: string; right_path: string; left_hash: string; right_hash: string; verdict: string; policy: string; expires_at: string }
export function activeRelations(store: Store, at = nowIso()): RelationRow[] {
  return store.statement(`SELECT key,left_path,right_path,left_hash,right_hash,expires_at,
    json_extract(output,'$.verdict') verdict,json_extract(output,'$.policy') policy
    FROM feed_relation_pairs WHERE expires_at>? ORDER BY key`).all(at) as RelationRow[];
}
export function relationRevision(store: Store): string {
  return hash({ policy: store.meta('relation_policy'), version: store.meta('relation_version') });
}
export async function recommendationManifest(input: string | Iterable<Publication> | Map<string, Publication>, store: Store, at = nowIso(), rows = activeRelations(store, at)): Promise<RecommendationManifest> {
  const posts = input instanceof Map ? input : new Map((typeof input === 'string' ? await publications(input, at) : [...input]).map(post => [post.path, post]));
  const items: RecommendationManifest['items'] = {};
  const policy = store.meta('relation_policy');
  for (const row of rows) {
    const left = posts.get(row.left_path), right = posts.get(row.right_path);
    if (!left || !right || left.hash !== row.left_hash || right.hash !== row.right_hash || row.policy !== policy) continue;
    if (!['same-event', 'direct-followup'].includes(row.verdict) || left.path === right.path || left.url && left.url === right.url) continue;
    for (const [source, target] of [[left, right], [right, left]] as [Publication, Publication][]) {
      const targets = items[source.path] ??= [];
      if (!targets.some(item => item.path === target.path)) targets.push({ path: target.path, expires_at: row.expires_at });
    }
  }
  for (const path of Object.keys(items)) items[path] = items[path]!.sort((a, b) => posts.get(b.path)!.date - posts.get(a.path)!.date || a.path.localeCompare(b.path)).slice(0, 6);
  return { version: 1, items };
}
