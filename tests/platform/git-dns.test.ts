import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { configureGitDns, git } from '../../src/platform/git.js';

test('Git DNS configuration uses fresh public DoH answers while retaining URL and TLS policy', async t => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-git-dns-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const previous = process.env.FEEDGARDEN_DNS_OVER_HTTPS;
  process.env.FEEDGARDEN_DNS_OVER_HTTPS = 'https://resolver.example/git-test';
  t.after(() => { if (previous === undefined) delete process.env.FEEDGARDEN_DNS_OVER_HTTPS; else process.env.FEEDGARDEN_DNS_OVER_HTTPS = previous; });
  let address = '8.8.8.8';
  t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
    const url = new URL(String(input)), type = Number(url.searchParams.get('type'));
    return Response.json({ Status: 0, Question: [{ name: url.searchParams.get('name'), type }],
      Answer: type === 1 ? [{ type: 1, TTL: 0, data: address }] : [] });
  });
  await git(['init', '--quiet'], root);
  const repository = 'https://publisher.example/owner/repo.git';
  await git(['remote', 'add', 'origin', repository], root);
  await configureGitDns(repository, root);
  assert.equal(await git(['config', '--local', '--get', 'http.curloptResolve'], root), 'publisher.example:443:8.8.8.8');
  address = '1.1.1.1';
  await configureGitDns(repository, root);
  assert.equal(await git(['config', '--local', '--get', 'http.curloptResolve'], root), 'publisher.example:443:1.1.1.1');
  assert.equal(await git(['remote', 'get-url', 'origin'], root), repository);
  const config = await git(['config', '--local', '--list'], root);
  assert.doesNotMatch(config, /sslverify|sslbackend|http\.proxy/);
  address = '198.18.0.1';
  await assert.rejects(configureGitDns(repository, root), /non-public/);
  await configureGitDns('git@publisher.example:owner/repo.git', root);
});

test('Git HTTP transport consumes the checkout-local address pin and retains the original Host', async t => {
  const root = await mkdtemp(join(tmpdir(), 'fdg-git-pin-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const requests: { host: string | undefined; url: string | undefined }[] = [];
  const head = 'a'.repeat(40);
  const server = createServer((request, response) => {
    requests.push({ host: request.headers.host, url: request.url });
    response.setHeader('Connection', 'close');
    response.end(request.url?.startsWith('/repo.git/info/refs') ? head + '\trefs/heads/main\n' : 'ref: refs/heads/main\n');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((done, fail) => server.close(error => error ? fail(error) : done())));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const host = 'git-pin.invalid:' + address.port, repository = 'http://' + host + '/repo.git';
  await git(['init', '--quiet'], root);
  // A loopback listener tests Git/libcurl's configuration contract without
  // relaxing the application's public-address validation or using live DNS.
  await git(['config', 'http.curloptResolve', host + ':127.0.0.1'], root);
  await git(['config', 'http.proxy', ''], root);
  const refs = await git(['ls-remote', repository, 'refs/heads/main'], root, AbortSignal.timeout(10_000));
  assert.equal(refs, head + '\trefs/heads/main');
  assert.ok(requests.some(request => request.url?.startsWith('/repo.git/info/refs')));
  assert.ok(requests.every(request => request.host === host));
});
