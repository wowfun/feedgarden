import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { run } from '../src/build-site.js';
import { hash } from '../src/util.js';

const commit = '7c634e0d396b1e7af9f63315b414925fe4f29ae7';
const source = resolve('.local/twitter-cli-source'), environment = resolve('.local/twitter-cli');
if (!existsSync(source)) await run('git', ['clone', '--no-checkout', 'https://github.com/public-clis/twitter-cli.git', source], process.cwd());
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
if (revision !== commit) await run('git', ['checkout', '--detach', commit], source);
await run('uv', ['sync', '--frozen', '--no-dev', '--project', source], process.cwd(), { ...process.env, UV_PROJECT_ENVIRONMENT: environment });
const authFile = join(source, 'twitter_cli/auth.py');
const original = execFileSync('git', ['show', commit + ':twitter_cli/auth.py'], { cwd: source, encoding: 'utf8' });
const position = original.indexOf('def get_cookies()');
if (position < 0) throw new Error('Pinned Twitter authentication entrypoint is missing');
const patched = original.slice(0, position) + `def get_cookies() -> Dict[str, str]:
    """Feedgarden: explicit environment cookies only; never inspect browsers."""
    cookies = load_from_env()
    if not cookies:
        raise AuthenticationError("Feedgarden requires TWITTER_AUTH_TOKEN and TWITTER_CT0")
    verify_cookies(cookies["auth_token"], cookies["ct0"])
    return cookies
`;
const existing = await readFile(authFile, 'utf8');
if (existing !== original && existing !== patched) throw new Error('Refusing to replace unrelated Twitter authentication changes');
await writeFile(authFile, patched);
await mkdir(environment, { recursive: true });
await writeFile(join(environment, 'feedgarden-env-only.json'), JSON.stringify({ commit, authFile, authHash: hash(patched) }, null, 2));
// These checks replace the browser/network functions with tripwires, and never
// read real credentials or make requests to X.
execFileSync(join(environment, 'bin/python'), ['-c', `
import os
from unittest.mock import patch
from twitter_cli.auth import get_cookies, AuthenticationError
with patch('twitter_cli.auth.extract_from_browser', side_effect=AssertionError('browser access')), patch.dict(os.environ, {}, clear=True):
    try:
        get_cookies()
        raise AssertionError('missing credentials accepted')
    except AuthenticationError:
        pass
with patch('twitter_cli.auth.extract_from_browser', side_effect=AssertionError('browser access')), patch('twitter_cli.auth.verify_cookies', side_effect=AuthenticationError('expired')), patch.dict(os.environ, {'TWITTER_AUTH_TOKEN':'fixture','TWITTER_CT0':'fixture'}, clear=True):
    try:
        get_cookies()
        raise AssertionError('expired credentials accepted')
    except AuthenticationError:
        pass
print('Explicit-cookie missing/expired checks passed; browser extraction was not called.')
`], { stdio: 'inherit' });
console.log('Pinned Twitter CLI installed. No credentials were requested or tested against X.');
