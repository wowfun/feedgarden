import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { processCommand } from './process-command.js';
import { assertSiteBundle, readSiteBundle, siteBundleFiles } from './site-bundle.js';

export async function run(program: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  await new Promise<void>((done, fail) => {
    const [executable, argv] = processCommand(program, args, env);
    const child = spawn(executable, argv, { cwd, env, stdio: 'inherit', windowsHide: true });
    child.on('error', fail); child.on('exit', code => code === 0 ? done() : fail(new Error(program + ' exited with ' + code)));
  });
}
export function validationEnvironment(inherited: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { GIT_TERMINAL_PROMPT: '0' };
  for (const name of ['PATH', 'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'APPDATA', 'LOCALAPPDATA', 'PATHEXT', 'COMSPEC', 'LANG', 'LC_ALL', 'TZ', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'WINDIR']) if (inherited[name]) env[name] = inherited[name];
  return env;
}
export async function buildSite(root = process.cwd()): Promise<string> {
  const project = process.cwd();
  const bundle = await readSiteBundle(project);
  if (resolve(root) !== resolve(project)) assertSiteBundle(bundle, await readSiteBundle(root));
  const ruby = join(homedir(), '.rbenv/versions/4.0.6/bin');
  const env = { ...validationEnvironment(), PATH: [existsSync(ruby) ? ruby : '', process.env.PATH].filter(Boolean).join(delimiter), BUNDLE_GEMFILE: join(project, 'Gemfile'), BUNDLE_APP_CONFIG: join(project, '.bundle'), BUNDLE_FROZEN: 'true' };
  try {
    try { const [program, args] = processCommand('bundle', ['check'], env); execFileSync(program, args, { cwd: project, env, stdio: 'ignore' }); }
    catch { await run('bundle', ['install'], project, env); }
    await run('bundle', ['exec', 'jekyll-obsidian', 'build'], resolve(root), env);
  } finally {
    const after = await readSiteBundle(project);
    if (siteBundleFiles.some(file => after[file] !== bundle[file])) throw new Error('Site build changed the frozen Gemfile or Gemfile.lock');
  }
  return join(resolve(root), '.jekyll-obsidian-cache/site');
}
