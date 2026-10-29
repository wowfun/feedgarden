import { execFileSync } from 'node:child_process';
import { delimiter,join,resolve } from 'node:path';
import { run,validationEnvironment } from '../src/platform/process/execute.js';

export async function installLocalTheme(gem: string, gemHome: string) {
  const environment = validationEnvironment();
  const ruby = (args: string[]) => execFileSync('ruby', args, { env: environment, encoding: 'utf8' }).trim();
  const fullName = ruby(['-rrubygems/package', '-e', 'puts Gem::Package.new(ARGV.fetch(0)).spec.full_name', resolve(gem)]);
  if (!/^jekyll-obsidian-site-[a-zA-Z0-9.]+$/.test(fullName)) throw new Error('Expected a jekyll-obsidian-site gem');
  const gemPath = ruby(['-rrubygems', '-e', 'puts Gem.path.join(File::PATH_SEPARATOR)']);
  const env = { ...environment, GEM_HOME: gemHome, GEM_PATH: gemHome + delimiter + gemPath };
  await run('ruby', ['-rrubygems/gem_runner', '-e', 'Gem::GemRunner.new.run(ARGV)', '--', 'install', resolve(gem), '--local', '--ignore-dependencies', '--no-document', '--install-dir', gemHome], process.cwd(), env);
  return { env, executable: join(gemHome, 'gems', fullName, 'website/exe/jekyll-obsidian') };
}
