import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2), packageSuite = args.includes('--suite=package');
const packageModules = new Set(['agent', 'e2e', 'instance', 'platform', 'publishing', 'runs', 'storage']);
const files = readdirSync('tests', { recursive: true }).map(file => file.replaceAll('\\', '/'))
  .filter(file => file.endsWith('.test.ts') && (!packageSuite || packageModules.has(file.split('/')[0])))
  .map(file => 'tests/' + file).sort();
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=1', '--test-timeout=120000', ...args.filter(arg => arg !== '--suite=package'), ...files], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
