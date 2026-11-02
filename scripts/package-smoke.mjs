import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { processCommand } from '../dist/src/platform/process/command.js';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  activeCli = process.env.npm_execpath;
if (!activeCli) throw new Error('Run through pnpm run test:package or npm run test:package');
const packagedBy = basename(activeCli).startsWith('pnpm') ? 'pnpm' : 'npm';
const root = await mkdtemp(join(tmpdir(), 'fdg-package-'));
const run = (program, args, cwd = root, env = process.env, { installation = false } = {}) => {
  const result = spawnSync(program, args, {
    cwd,
    env,
    windowsHide: true,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 8_000_000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${program} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  if (installation) assert.doesNotMatch(result.stdout + '\n' + result.stderr, /^npm warn deprecated\b|\bWARN\b[^\r\n]*\bdeprecated\b/im, 'Package installation must not emit deprecation warnings');
  return result.stdout;
};
const manager = (name, args, cwd = root, env = process.env, options = {}) => {
  const [program, argv] = name === packagedBy
    ? /\.[cm]?js$/i.test(activeCli) ? [process.execPath, [activeCli, ...args]] : [activeCli, args]
    : processCommand(name, args, env);
  return run(program, argv, cwd, env, options);
};
const result = output => {
  const envelopes = output.split(/\r?\n/).filter(line => line.startsWith('{"schemaVersion":'));
  assert.equal(envelopes.length, 1, output);
  return JSON.parse(envelopes[0]);
};
try {
  const manifest = JSON.parse(manager(packagedBy, ['pack', '--json', '--pack-destination', root], project));
  const packed = Array.isArray(manifest) ? manifest[0] : manifest;
  assert.ok(packed.files.some((f) => f.path === 'dist/src/cli.js'));
  assert.ok(packed.files.every((f) => !/(^|\/)node_modules\/whatwg-encoding\//.test(f.path)));
  const skillFiles = (await readdir(join(project, 'skills'), { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => relative(project, join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .sort();
  for (const file of skillFiles) assert.ok(packed.files.some(f => f.path === file), file);
  assert.ok(packed.files.every((f) => !/^(content|tests|scripts|\.local|\.agents)\//.test(f.path)));
  for (const name of ['pnpm', 'npm']) await checkConsumer(name, resolve(root, packed.filename), skillFiles, packed);
} finally {
  const rel = relative(tmpdir(), root);
  assert.ok(rel && !rel.startsWith('..') && !resolve(root).endsWith('Temp'));
  await rm(root, { recursive: true, force: true });
}

async function checkConsumer(name, tarball, skillFiles, packed) {
  const consumer = join(root, name), install = join(consumer, 'installed'), cache = join(consumer, 'cache');
  await mkdir(consumer);
  await mkdir(install);
  await writeFile(join(install, 'package.json'), '{"private":true}');
  const env = {
    ...process.env,
    APPDATA: join(consumer, 'Roaming'),
    LOCALAPPDATA: join(consumer, 'Local'),
    XDG_CONFIG_HOME: join(consumer, 'xdg/config'),
    XDG_DATA_HOME: join(consumer, 'xdg/data'),
    XDG_STATE_HOME: join(consumer, 'xdg/state'),
    XDG_CACHE_HOME: join(consumer, 'xdg/cache'),
    npm_config_cache: cache,
  };
  // Consumers supply their own build policy and cannot inherit module lookup
  // paths or the development project's npm allowScripts policy.
  for (const key of Object.keys(env))
    if (/^npm_config_(allow_scripts|dangerously_allow_all_scripts)$|^NODE_PATH$/i.test(key)) delete env[key];
  if (name === 'pnpm') {
    env.pnpm_config_store_dir = join(cache, 'pnpm-store');
    env.pnpm_config_cache_dir = join(cache, 'pnpm-cache');
    await writeFile(join(install, 'pnpm-workspace.yaml'), 'strictDepBuilds: true\nallowBuilds: {}\n');
    manager(name, ['--dir', install, 'add', '--save-exact', tarball], consumer, env, { installation: true });
  } else manager(name, ['install', '--prefix', install, '--strict-allow-scripts', '--no-audit', '--no-fund', tarball], consumer, env, { installation: true });
  const entry = join(install, 'node_modules/feedgarden/dist/src/cli.js');
  const cli = (...args) => result(run(process.execPath, [entry, ...args], consumer, env));
  const execCli = (...args) => result(manager(name, name === 'pnpm'
    ? ['--package', tarball, 'dlx', 'fdg', ...args]
    : ['exec', '--yes', '--strict-allow-scripts', '--package', tarball, '--', 'fdg', ...args], consumer, env));
  assert.equal(cli('version').result.package, 'feedgarden');
  assert.equal(cli('help', '--json').schemaVersion, 1);
  // Exercise the public command through a fresh dlx/npm exec installation.
  const setup = execCli('setup');
  assert.equal(setup.state, 'completed');
  const configFile = setup.result.configFile;
  const config = JSON.parse(await readFile(configFile, 'utf8'));
  config.sources = [];
  await writeFile(configFile, JSON.stringify(config));
  assert.equal(cli('doctor').state, 'completed');
  const contract = cli('help', '--json');
  assert.ok(!contract.commands.some(command => command.path === 'targets adopt'));
  assert.ok(contract.commands.find(command => command.path === 'targets add').options.includes('worktree'));
  assert.deepEqual(contract.commands.find(command => command.path === 'topics apply').options, ['detach']);
  const remote = join(consumer, 'remote.git'), worktree = join(consumer, 'publication');
  await mkdir(remote); await mkdir(join(worktree, 'feed'), { recursive: true });
  run('git', ['init', '--bare', '--initial-branch=main'], remote, env);
  run('git', ['init', '--initial-branch=main'], worktree, env);
  run('git', ['remote', 'add', 'origin', remote], worktree, env);
  await writeFile(join(worktree, 'feed/manual.md'), 'Authored content without a database identity\n');
  assert.equal(cli('targets', 'add', 'installed', '--repository', remote, '--worktree', worktree).state, 'completed');
  assert.equal(cli('targets', 'inspect', 'installed').result.worktree, worktree);
  assert.equal(cli('export', '--target', 'installed').result.export.output, join(worktree, 'feed'));
  assert.equal(cli('publish', '--target', 'installed', '--dry-run').result.targets[0].dryRun, true);
  assert.equal(cli('publish', '--target', 'installed').result.targets[0].confirmed, true);
  assert.equal(run('git', ['show', 'main:feed/manual.md'], remote, env).trim(), 'Authored content without a database identity');
  const detached = cli('process', '--detach');
  assert.ok(detached.runId);
  const next = detached.nextActions[0],
    status = result(run(next.executable, [...next.argv, '--wait-seconds', '20'], consumer, env));
  assert.equal(status.result.runs[0].state, 'completed');
  const skill = join(consumer, 'agent-skills/feedgarden');
  const installedSkill = cli('skill', 'install', skill);
  assert.equal(installedSkill.state, 'completed');
  assert.equal(cli('skill', 'status', skill).result.verified, true);
  const runtimeRoot = resolve(dirname(installedSkill.result.receipt.argv[0]), '../..');
  for (const file of skillFiles) assert.equal(await readFile(join(runtimeRoot, file), 'utf8'), await readFile(join(project, file), 'utf8'));
  // The portable runtime must resolve parsers and their transitive dependencies
  // from its owned copy, even when installed through pnpm's linked layout.
  const parser = pathToFileURL(join(runtimeRoot, 'dist/src/sources/index.js')).href;
  run(process.execPath, ['--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    import { parseFeed } from ${JSON.stringify(parser)};
    const context = {source:'rss',stream:'main',channel:'feed',observedAt:'2026-11-01T00:00:00.000Z'};
    const [rss] = parseFeed('<rss><channel><item><title>Fixture</title><link>https://example.test/a</link><description>&lt;p&gt;Portable evidence.&lt;/p&gt;</description></item></channel></rss>', context);
    assert.equal(rss.text, 'Portable evidence.');
    const [atom] = parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml">Portable <b>XHTML</b></div></title><link href="https://example.test/a"/><summary type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>First paragraph.</p><p>Second &lt;literal&gt;.</p></div></summary></entry></feed>', context);
    assert.equal(atom.title, 'Portable XHTML');
    assert.equal(atom.text, 'First paragraph. Second <literal>.');
  `], consumer, env);
  // Public shims preserve package identity and literal URL metacharacters.
  const version = execCli('version');
  assert.equal(version.result.packageVersion, packed.version);
  const url = 'https://example.invalid/feed?a=1&b=%25^literal';
  const response = execCli('subscriptions', 'add', 'rss', 'literal', '--url', url);
  assert.equal(response.state, 'completed');
  const changed = JSON.parse(await readFile(configFile, 'utf8'));
  assert.equal(changed.sources[0].streams[0].routes[0].url, url);
  if (name === 'pnpm') {
    assert.ok((await readdir(env.pnpm_config_store_dir)).length, 'pnpm must populate its isolated content store');
    assert.ok((await readdir(env.pnpm_config_cache_dir)).length, 'pnpm must populate its isolated cache');
  }
  console.log(
    JSON.stringify({
      node: process.version,
      package: packed.name,
      version: packed.version,
      packagedBy,
      packageManager: name,
      files: packed.files.length,
      strictAllowScripts: name === 'npm',
      strictDepBuilds: name === 'pnpm',
      deprecationWarnings: false,
      detached: true,
      skill: true,
      npx: name === 'npm',
      pnpmDlx: name === 'pnpm',
      portableParser: true,
      gitPublication: true,
      urlMetacharacters: true,
    }),
  );
}
