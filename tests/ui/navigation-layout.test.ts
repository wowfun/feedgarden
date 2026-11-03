import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { parseNavigationLayout,previewNavigationConfig,verifyNavigationLayout } from '../../scripts/navigation-layout.js';

test('preview layout overrides preserve navigation settings and do not mutate the host', () => {
  const config = { title: 'Host', website: { navigation: { home: { label: 'Start' }, layout: 'top' }, theme: 'minimal' } };
  const result = previewNavigationConfig(config, 'sidebar');
  assert.equal(result.website.navigation.layout, 'sidebar');
  assert.deepEqual(result.website.navigation.home, { label: 'Start' });
  assert.equal(config.website.navigation.layout, 'top');
  assert.deepEqual(previewNavigationConfig(config), config);
  assert.deepEqual(previewNavigationConfig({ website: {} }, 'sidebar'), { website: { navigation: { layout: 'sidebar' } } });
});

test('preview layout options reject misspellings before building', () => {
  assert.equal(parseNavigationLayout(undefined), undefined);
  assert.equal(parseNavigationLayout('top'), 'top');
  assert.equal(parseNavigationLayout('sidebar'), 'sidebar');
  for (const value of ['', 'left', 'Sidebar']) assert.throws(() => parseNavigationLayout(value), /must be top or sidebar/);
  assert.throws(() => parseNavigationLayout('left'), /got "left"/);
});

test('both verifiers reject invalid overrides before reading configuration', () => {
  for (const script of ['verify-clippings', 'verify-footer']) {
    const layout = 'left';
    const result = spawnSync(process.execPath, ['--import', 'tsx', `scripts/${script}.ts`, '--navigation-layout', layout!, '--config', '__missing_preview_config__.json'], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be top or sidebar, got "left"/);
    assert.doesNotMatch(result.stderr, /ENOENT/);
  }
});

test('layout verification requires the rendered layout to match the configuration', () => {
  assert.equal(verifyNavigationLayout('top', 'top'), 'top');
  assert.equal(verifyNavigationLayout('sidebar', 'sidebar'), 'sidebar');
  assert.throws(() => verifyNavigationLayout(null, 'top'), /Unknown rendered navigation layout/);
  assert.throws(() => verifyNavigationLayout('top', 'sidebar'), /does not match configuration/);
  assert.throws(() => verifyNavigationLayout('sidebar', 'top'), /does not match configuration/);
  assert.throws(() => verifyNavigationLayout('left', 'sidebar'), /Unknown rendered navigation layout/);
});
