---
publish: true
content_type: "post"
title: "Faster Python startup with lazy imports"
description: "Python programs normally import every dependency at startup. An upcoming Python release adds lazy imports, written by prefixing an import statement with the keyword lazy, so that a name such as json becomes a placeholder object rather than "
date: "2026-10-09T03:16:39.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://lemire.me/blog/2026/10/09/faster-python-startup-with-lazy-imports/"
discussion_url: "https://news.ycombinator.com/item?id=50015571"
tags: ["source/hackernews","topics/coding","topics/inference","topics/evaluation"]
---

## Article

Python programs normally import every dependency at startup. An upcoming Python release adds lazy imports, written by prefixing an import statement with the keyword lazy, so that a name such as json becomes a placeholder object rather than the module itself. The real import happens only when the name is first used, and if it is never used the module is never loaded.

The author measured the effect with a toy command-line tool that imports sixteen modules: json, csv, decimal, sqlite3, asyncio, email.parser, http.client, urllib.request, xml.etree.ElementTree, zipfile, tarfile, statistics, plus numpy, pandas, requests and rich. The tool has three paths: --version prints a string, mean reads a small CSV with the csv module and calls statistics.fmean, and stats loads the same file with pandas and prints a summary. The lazy version differs only by one added word per import line.

On Python 3.15.0b4, an Intel Xeon Gold 6548N &#40;Emerald Rapids&#41;, with numpy 2.5, pandas 3.0 and requests 2.34, the measured times were:

- --version: 295 ms eager versus 20 ms lazy, a 15x speedup.
- mean: 296 ms versus 24 ms, about 12x.
- stats: 299 ms versus 224 ms, only 1.3x.

Subtracting interpreter startup of 11.7 ms, the import cost for --version falls from 283 ms to roughly 8 ms, about a 35-fold reduction. The gain is largest when little of the imported surface is used, and small when a heavy path actually needs most modules.

The author notes a downside: errors move. With eager imports a missing module fails at startup; with lazy imports it fails at first use, possibly deep inside a function or hours later in a long-running server. The source code is published alongside the post.

## HN discussion

Based on 1 selected comments and replies.

One commenter &#40;EdwardDiego&#41; raises a practical way to soften the downside of deferred failures: a decent checker such as Mypy or ty should still flag libraries that are not actually present in the venv, and unit tests can cover all code branches. The point is offered as a mitigation rather than a rebuttal of the reported startup gains.

Selected comments: [EdwardDiego](https://news.ycombinator.com/item?id=50015834)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50015571>)

## Images and video

- [Image: Eager imports take about 300 ms. Lazy imports take 20 ms for --version, 24 ms for mean, and 224 ms for stats.](<https://lemire.me/blog/wp-content/uploads/2026/10/lazy-startup.webp>)
