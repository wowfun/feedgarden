import assert from 'node:assert/strict';
import test from 'node:test';
import { htmlFragment, readableText } from '../../src/sources/html.js';

test('readable HTML text preserves inline joins, block boundaries and decoded literals', () => {
  const cases = [
    ['<span>A</span><em>B</em>C', 'ABC'],
    ['Before<div>First <em>inline</em><p>Second</p>Tail</div>After', 'Before First inline Second Tail After'],
    ['<h1>Heading</h1><ul><li>One</li><li>Two<br>More</li></ul><blockquote>Quote</blockquote><pre>code\n line</pre>', 'Heading One Two More Quote code line'],
    ['<p>if x&lt;y; &amp;copy; &lt;b&gt;literal&lt;/b&gt;</p>', 'if x<y; &copy; <b>literal</b>'],
    ['<table><tr><th>Name</th><th>Value</th></tr><tr><td>cell <em>one</em></td><td>cell two</td></tr></table>', 'Name Value cell one cell two'],
    ['<dl><dt>First term</dt><dd>First <b>definition</b></dd><dt>Second term</dt><dd>Second definition</dd></dl>', 'First term First definition Second term Second definition'],
    ['Before<!-- ignored --><template><p>Hidden<template>Nested</template></p></template>After', 'BeforeAfter'],
    ['', ''],
  ];
  for (const [html, expected] of cases) assert.equal(readableText(htmlFragment(html!)), expected);
});

test('readable HTML text stays within its selected root and leaves the DOM intact', () => {
  const fragment = htmlFragment('<aside>Before</aside><article><p>First<br>Next</p><p>Last</p></article><aside>After</aside>');
  const article = fragment.querySelector('article')!, paragraph = article.querySelector('p')!;
  const before = article.outerHTML;
  assert.equal(readableText(article), 'First Next Last');
  assert.equal(article.outerHTML, before);
  assert.equal(article.querySelector('p'), paragraph);
  assert.equal(readableText(article.querySelector('br')!), '');
});
