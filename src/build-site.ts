import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';

export async function run(program: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  await new Promise<void>((done, fail) => {
    const child = spawn(program, args, { cwd, env, stdio: 'inherit' });
    child.on('error', fail); child.on('exit', code => code === 0 ? done() : fail(new Error(program + ' exited with ' + code)));
  });
}
export async function buildSite(root = process.cwd()): Promise<string> {
  const project = process.cwd();
  const lock = JSON.parse(await readFile(join(root, '.github/theme.lock.json'), 'utf8')) as { repository: string; commit: string };
  if (!/^[a-f0-9]{40}$/.test(lock.commit)) throw new Error('Theme lock requires a full commit SHA');
  let upstream = resolve(project, '.local/themes', lock.commit);
  const reference = resolve(project, '.references/jekyll-obsidian');
  if (existsSync(reference) && execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() === lock.commit) upstream = reference;
  if (!existsSync(upstream)) {
    await mkdir(dirname(upstream), { recursive: true });
    await run('git', ['clone', '--no-checkout', lock.repository, upstream], project);
    await run('git', ['checkout', '--detach', lock.commit], upstream);
  }
  if (execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== lock.commit) throw new Error('Theme checkout differs from the lock');
  if (execFileSync('git', ['-C', upstream, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim()) throw new Error('Pinned theme has uncommitted changes');
  const website = join(upstream, 'website');
  const ruby = join(homedir(), '.rbenv/versions/4.0.6/bin');
  let node = dirname(process.execPath);
  if (!process.version.startsWith('v26.')) {
    const versions = join(homedir(), '.nvm/versions/node');
    const installed = existsSync(versions) ? (await readdir(versions)).filter(version => version.startsWith('v26.')).sort().at(-1) : undefined;
    if (!installed) throw new Error('MANUAL_ACTION: Install Node 26 for the Jekyll frontend build');
    node = join(versions, installed, 'bin');
  }
  const env = { ...process.env, PATH: [ruby, node, process.env.PATH].join(':'), BUNDLE_GEMFILE: join(website, 'Gemfile') };
  if (!existsSync(join(website, 'node_modules'))) await run('npm', ['ci'], website, env);
  try { execFileSync('bundle', ['check'], { cwd: website, env, stdio: 'ignore' }); }
  catch { await run('bundle', ['install'], website, env); }
  await run('npm', ['run', 'build'], website, env);
  await run('bundle', ['exec', 'ruby', join(website, 'scripts/package.rb'), '--skip-assets'], website, env);
  await run('bundle', ['exec', 'ruby', join(website, 'exe/jekyll-obsidian'), 'build'], resolve(root), env);
  return join(resolve(root), '.jekyll-obsidian-cache/site');
}
