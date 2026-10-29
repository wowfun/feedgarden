import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run test:package so the npm CLI is explicit');
const root = await mkdtemp(join(tmpdir(), 'fdg-package-'));
const run = (program, args, cwd = root, env = process.env) =>
  execFileSync(program, args, {
    cwd,
    env,
    windowsHide: true,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 8_000_000,
  });
try {
  const packed = JSON.parse(
    run(process.execPath, [npm, 'pack', '--json', '--pack-destination', root], project),
  )[0];
  assert.ok(packed.files.some((f) => f.path === 'dist/src/cli.js'));
  assert.ok(packed.files.every((f) => !/^(content|tests|scripts|\.local|\.agents)\//.test(f.path)));
  const tarball = join(root, packed.filename),
    install = join(root, 'installed'),
    cache = join(root, 'npm-cache');
  await mkdir(install);
  await writeFile(join(install, 'package.json'), '{"private":true}');
  const env = {
    ...process.env,
    APPDATA: join(root, 'Roaming'),
    LOCALAPPDATA: join(root, 'Local'),
    XDG_CONFIG_HOME: join(root, 'xdg/config'),
    XDG_DATA_HOME: join(root, 'xdg/data'),
    XDG_STATE_HOME: join(root, 'xdg/state'),
    XDG_CACHE_HOME: join(root, 'xdg/cache'),
    npm_config_cache: cache,
  };
  // npm run exports the development project's allowScripts policy as an env
  // option. A clean consumer project must supply its own policy instead.
  for (const key of Object.keys(env))
    if (/^npm_config_(allow_scripts|dangerously_allow_all_scripts)$/i.test(key)) delete env[key];
  run(
    process.execPath,
    [npm, 'install', '--prefix', install, '--strict-allow-scripts', '--no-audit', '--no-fund', tarball],
    root,
    env,
  );
  const entry = join(install, 'node_modules/feedgarden/dist/src/cli.js');
  const cli = (...args) => JSON.parse(run(process.execPath, [entry, ...args], root, env));
  assert.equal(cli('version').result.package, 'feedgarden');
  assert.equal(cli('help', '--json').schemaVersion, 1);
  const setup = cli('setup');
  assert.equal(setup.state, 'completed');
  const configFile = setup.result.configFile;
  const config = JSON.parse(await readFile(configFile, 'utf8'));
  config.sources = [];
  await writeFile(configFile, JSON.stringify(config));
  assert.equal(cli('doctor').state, 'completed');
  const detached = cli('process', '--detach');
  assert.ok(detached.runId);
  const next = detached.nextActions[0],
    status = JSON.parse(run(next.executable, [...next.argv, '--wait-seconds', '20'], root, env));
  assert.equal(status.result.runs[0].state, 'completed');
  const skill = join(root, 'agent-skills/feedgarden');
  assert.equal(cli('skill', 'install', skill).state, 'completed');
  assert.equal(cli('skill', 'status', skill).result.verified, true);
  // A clean npm exec cache and the public Windows shim both preserve literal URL metacharacters.
  const version = JSON.parse(
    run(
      process.execPath,
      [npm, 'exec', '--yes', '--strict-allow-scripts', '--package', tarball, '--', 'fdg', 'version'],
      root,
      env,
    ),
  );
  assert.equal(version.result.packageVersion, packed.version);
  const url = 'https://example.invalid/feed?a=1&b=%25^literal';
  const response = JSON.parse(
    run(
      process.execPath,
      [
        npm,
        'exec',
        '--yes',
        '--strict-allow-scripts',
        '--package',
        tarball,
        '--',
        'fdg',
        'subscriptions',
        'add',
        'rss',
        'literal',
        '--url',
        url,
      ],
      root,
      env,
    ),
  );
  assert.equal(response.state, 'completed');
  const changed = JSON.parse(await readFile(configFile, 'utf8'));
  assert.equal(changed.sources[0].streams[0].routes[0].url, url);
  console.log(
    JSON.stringify({
      node: process.version,
      package: packed.name,
      version: packed.version,
      files: packed.files.length,
      strictAllowScripts: true,
      detached: true,
      skill: true,
      npx: true,
      urlMetacharacters: true,
    }),
  );
} finally {
  const rel = relative(tmpdir(), root);
  assert.ok(rel && !rel.startsWith('..') && !resolve(root).endsWith('Temp'));
  await rm(root, { recursive: true, force: true });
}
