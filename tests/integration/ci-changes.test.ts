import assert from 'node:assert/strict';
import { execFile,execFileSync } from 'node:child_process';
import { mkdir,mkdtemp,readFile,rename,rm,writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname,join,resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { classifyPaths,planChanges } from '../../scripts/ci-changes.mjs';

const unavailable = async () => { throw new Error('API unavailable'); };
const success = (head: string, overrides = {}) => ({ id: 1, head_sha: head, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success', ...overrides });
const context = { eventName: 'push', event: { ref: 'refs/heads/main' }, runId: '99' };
const history = (runs: unknown[]) => async (path: string) => path === 'actions/runs/99' ? { workflow_id: 42 } : { workflow_runs: runs };

async function repository() {
  const cwd = await mkdtemp(join(tmpdir(), 'feedgarden-ci-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = async (path: string, value: string) => { await mkdir(dirname(join(cwd, path)), { recursive: true });await writeFile(join(cwd, path), value); };
  const commit = () => {
    git('add', '-A');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=.git/no-hooks', 'commit', '-qm', 'Fixture');
    return git('rev-parse', 'HEAD');
  };
  git('init', '-q', '-b', 'main');
  await put('README.md', 'Initial documentation');await put('src/example.ts', 'export const value = 1;');await put('content/example.md', 'Published content');
  return { cwd, git, put, commit, base: commit(), close: () => rm(cwd, { recursive: true, force: true }) };
}

test('CI scopes restrict the fast paths to documentation and public content', () => {
  assert.equal(classifyPaths([]), 'docs');
  assert.equal(classifyPaths(['docs/site.md', 'docs/nested/image.svg', 'README.md', 'README.zh-CN.md', 'AGENTS.md', 'THIRD_PARTY_NOTICES.md']), 'docs');
  assert.equal(classifyPaths(['content/article.md', 'content/_translations/zh-CN/article.md', 'docs/site.md']), 'site');
  for (const file of ['config/topics.json', 'config/locales/en.json', '.github/jekyll-obsidian.yml', 'Gemfile', 'Gemfile.lock', 'package.json', 'package-lock.json', '.nvmrc', 'tsconfig.json', 'feedgarden.jsonc', 'src/main.ts', 'scripts/ci-changes.mjs', 'tests/example.test.ts', '.github/workflows/pages.yml', 'resources/feedgarden-report/SKILL.md', 'unknown.md', 'content-other/item.md']) {
    assert.equal(classifyPaths(['docs/site.md', 'content/article.md', file]), 'full', file);
  }
});

test('PR classification includes earlier code changes and excludes base-branch-only changes', async t => {
  const repo = await repository();t.after(repo.close);
  repo.git('checkout', '-qb', 'feature');
  await repo.put('docs/guide.md', 'PR documentation');const docs = repo.commit();
  repo.git('checkout', 'main');await repo.put('src/base-only.ts', 'export {};');const baseHead = repo.commit();
  repo.git('checkout', 'feature');
  const plan = (head: string) => planChanges({ eventName: 'pull_request', event: { pull_request: { base: { sha: baseHead }, head: { sha: head } } }, sha: '', runId: '', api: unavailable, cwd: repo.cwd });
  assert.equal((await plan(docs)).mode, 'docs');
  await repo.put('src/feature.ts', 'export {};');repo.commit();
  await repo.put('docs/guide.md', 'Final documentation');const head = repo.commit();
  const result = await plan(head);
  assert.equal(result.mode, 'full');assert.equal(result.base, repo.base);
  assert.deepEqual(result.files, ['docs/guide.md', 'src/feature.ts']);
});

test('main classification carries code and content forward across cancelled or failed runs', async t => {
  const repo = await repository();t.after(repo.close);
  const plan = (head: string, runs: unknown[]) => planChanges({ ...context, sha: head, api: history(runs), cwd: repo.cwd });
  await repo.put('content/example.md', 'New publication');const content = repo.commit();
  await repo.put('README.md', 'Documentation after cancelled publication');const docs = repo.commit();
  const result = await plan(docs, [success(content, { id: 2, conclusion: 'cancelled' }), success(repo.base)]);
  assert.equal(result.mode, 'site');assert.equal(result.base, repo.base);
  assert.equal((await plan(docs, [success(content)])).mode, 'docs');
  await repo.put('src/example.ts', 'export const value = 2;');const code = repo.commit();
  await repo.put('README.md', 'Documentation after failed validation');const final = repo.commit();
  assert.equal((await plan(final, [success(code, { id: 3, conclusion: 'failure' }), success(repo.base)])).mode, 'full');
});

test('main history is scoped to this workflow and paginated past ineligible runs', async t => {
  const repo = await repository();t.after(repo.close);
  await repo.put('content/next.md', 'Next article');const sha = repo.commit();
  const requested: string[] = [];
  const api = async (path: string) => {
    requested.push(path);
    if (path === 'actions/runs/99') return { workflow_id: 42 };
    if (path.endsWith('page=1')) return { workflow_runs: [success(sha, { id: 99 }), success(sha, { event: 'pull_request' }), success(sha, { head_branch: 'feature' }), ...Array.from({ length: 97 }, () => success(sha, { event: 'schedule' }))] };
    return { workflow_runs: [success(repo.base, { event: 'workflow_dispatch' })] };
  };
  const result = await planChanges({ ...context, sha, api, cwd: repo.cwd });
  assert.equal(result.mode, 'site');assert.equal(result.base, repo.base);
  assert.deepEqual(requested, ['actions/runs/99', 'actions/workflows/42/runs?branch=main&status=success&per_page=100&page=1', 'actions/workflows/42/runs?branch=main&status=success&per_page=100&page=2']);
});

test('missing, invalid, unavailable or divergent baselines select full validation', async t => {
  const repo = await repository();t.after(repo.close);
  repo.git('checkout', '-qb', 'diverged');await repo.put('docs/diverged.md', 'Unrelated history');const divergent = repo.commit();
  repo.git('checkout', 'main');await repo.put('README.md', 'Main documentation');const sha = repo.commit();
  for (const api of [unavailable, history([]), history([success('a'.repeat(40))]), history([success('invalid')]), history([success(divergent)]), async () => ({ malformed: true })]) {
    assert.equal((await planChanges({ ...context, sha, api, cwd: repo.cwd })).mode, 'full');
  }
  assert.equal((await planChanges({ ...context, eventName: 'workflow_dispatch', sha, api: unavailable, cwd: repo.cwd })).mode, 'full');
  assert.equal((await planChanges({ ...context, event: { ref: 'refs/heads/feature' }, sha, api: unavailable, cwd: repo.cwd })).mode, 'full');
  assert.equal((await planChanges({ ...context, eventName: 'pull_request', sha, api: unavailable, cwd: repo.cwd })).mode, 'full');
});

test('deletions and cross-category renames include both sides of the change', async t => {
  const repo = await repository();t.after(repo.close);
  await repo.put('docs/moved.md', 'Movable documentation');await repo.put('docs/removed.md', 'Obsolete documentation');const base = repo.commit();
  await rename(join(repo.cwd, 'docs/moved.md'), join(repo.cwd, 'content/moved.md'));
  await rm(join(repo.cwd, 'docs/removed.md'));await repo.put('content/中文 article.md', 'New article');const content = repo.commit();
  const plan = (head: string, baseline: string) => planChanges({ ...context, sha: head, api: history([success(baseline)]), cwd: repo.cwd });
  assert.equal((await plan(content, base)).mode, 'site');
  await rename(join(repo.cwd, 'src/example.ts'), join(repo.cwd, 'docs/example.ts'));const code = repo.commit();
  const result = await plan(code, content);
  assert.equal(result.mode, 'full');assert.deepEqual(result.files, ['docs/example.ts', 'src/example.ts']);
  await rm(join(repo.cwd, 'content/example.md'));const removed = repo.commit();
  assert.equal((await plan(removed, code)).mode, 'site');
  assert.equal((await plan(removed, removed)).mode, 'docs');
});

test('the standalone classifier emits Actions outputs without npm dependencies', async t => {
  const repo = await repository();t.after(repo.close);
  await repo.put('docs/guide.md', 'Documentation');const head = repo.commit();
  const event = join(repo.cwd, 'event.json'), output = join(repo.cwd, 'output.txt'), summary = join(repo.cwd, 'summary.md');
  await writeFile(event, JSON.stringify({ pull_request: { base: { sha: repo.base }, head: { sha: head } } }));
  const env = { ...process.env, GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: event, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary };
  const script = resolve('scripts/ci-changes.mjs');
  const result = await promisify(execFile)(process.execPath, [script], { cwd: repo.cwd, env });
  assert.match(result.stdout, /CI mode: docs/);assert.equal(await readFile(output, 'utf8'), 'mode=docs\n');
  assert.match(await readFile(summary, 'utf8'), /1 changed paths/);
  await writeFile(event, 'invalid JSON');await writeFile(output, '');
  await promisify(execFile)(process.execPath, [script], { cwd: repo.cwd, env });
  assert.equal(await readFile(output, 'utf8'), 'mode=full\n');
});

test('the standalone main classifier reads workflow history and falls back on API failure', async t => {
  const repo = await repository();t.after(repo.close);
  await repo.put('content/next.md', 'Next article');const head = repo.commit();
  let failed = false;
  const requests: string[] = [];
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`);
    if (failed) { response.writeHead(403).end('Forbidden');return; }
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(request.url?.endsWith('/runs/99') ? { workflow_id: 42 } : { workflow_runs: [success(repo.base)] }));
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  t.after(() => new Promise<void>(done => server.close(() => done())));
  const address = server.address();assert.ok(address && typeof address !== 'string');
  const event = join(repo.cwd, 'event.json'), output = join(repo.cwd, 'output.txt');
  await writeFile(event, JSON.stringify(context.event));
  const env = { ...process.env, GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: event, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: '',
    GITHUB_API_URL: `http://127.0.0.1:${address.port}`, GITHUB_REPOSITORY: 'fixture/repository', GITHUB_RUN_ID: '99', GITHUB_SHA: head, GITHUB_TOKEN: 'fixture-only' };
  const invoke = () => promisify(execFile)(process.execPath, [resolve('scripts/ci-changes.mjs')], { cwd: repo.cwd, env });
  await invoke();assert.equal(await readFile(output, 'utf8'), 'mode=site\n');
  assert.deepEqual(requests, ['GET /repos/fixture/repository/actions/runs/99', 'GET /repos/fixture/repository/actions/workflows/42/runs?branch=main&status=success&per_page=100&page=1']);
  failed = true;await writeFile(output, '');
  const result = await invoke();assert.equal(await readFile(output, 'utf8'), 'mode=full\n');
  assert.ok(!result.stdout.includes('fixture-only'));assert.ok(!result.stderr.includes('fixture-only'));
});
