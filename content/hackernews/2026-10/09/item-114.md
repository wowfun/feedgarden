---
publish: true
content_type: "post"
title: "Once: a CLI that caches command output for a while"
description: "once is a small Go command-line tool that runs a command in the current directory, prints its stdout, and keeps that output in memory inside a per-user background daemon. Repeated calls with the same command, directory and tenant key are an"
date: "2026-10-09T09:43:06.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/alex0ptr/once"
discussion_url: "https://news.ycombinator.com/item?id=50018239"
tags: ["source/hackernews","topics/coding","topics/security-privacy","topics/open-source"]
---

## Article

once is a small Go command-line tool that runs a command in the current directory, prints its stdout, and keeps that output in memory inside a per-user background daemon. Repeated calls with the same command, directory and tenant key are answered from memory until the entry expires. The daemon shuts itself down once its last entry has expired.

The stated motivation is reducing repeated secret prompts: the README's example reads a token from 1Password with &#96;op read&#96;, so the first call asks for a fingerprint and further calls within the TTL do not. Usage is &#96;once --ttl DURATION &#91;--until TIME&#93; &#91;--tenant KEY&#93; &#91;--refresh&#93; &#91;--no-dir&#93; -- COMMAND &#91;ARGS...&#93;&#96;, installed via &#96;go install github.com/alex0ptr/once@latest&#96; &#40;Go 1.27+, standard library only, macOS and Linux&#41;. Everything after &#96;--&#96; is executed directly without a shell, so pipes and globs must be wrapped with &#96;sh -c&#96;.

Only stdout is cached; stdin and stderr pass through, so interactive prompts still work. Results of commands exiting non-zero are never cached, and the exit code is forwarded. By default the working directory is part of the cache key, because commands such as &#96;git rev-parse HEAD&#96; vary by directory; &#96;--no-dir&#96; omits the directory, and entries created with and without it are separate. &#96;--until&#96; sets an absolute deadline, and the entry expires at whichever comes first, &#96;--ttl&#96; or &#96;--until&#96;; the tool never computes relative dates, so the shell must supply them. If &#96;--until&#96; is already past, the command runs but is not cached. The cache key is HMAC-SHA256 over tenant, working directory and command plus args. The author notes the tenant key is a namespace rather than a security boundary and is not meant to be secret. &#96;once status&#96; shows the daemon and entry count; &#96;once clear&#96; drops all values and stops it.

## HN discussion

Based on 10 selected comments and replies.

Several commenters focused on the 1Password example. ShakataGaNai said the secret-reading use case landed hardest, describing frustration with repeatedly approving credential access during agent-driven test runs, and admitted having asked agents to write credentials to a .env file to avoid approving every time; the author &#40;alex0ptr&#41; replied that they had feared nobody shared that workflow. Others compared prior art: aktau pointed to their own shell-script tool memo, noting it needs no build and stores compressed output under /tmp, whereas once keeps the cache in a running daemon, calling the trade-offs a security consideration. thomascountz said they use that script daily and learned from its design. &#95;&#95;MatrixMan&#95;&#95; wished applications exposed enough metadata for the OS to decide when reruns are needed, citing NixOS for builds but not arbitrary processes, and jchw observed that some use cases can be forced into the Nix build system with varying success. deadbunny quipped about finally getting cache invalidation in the terminal.

Selected comments: [ShakataGaNai](https://news.ycombinator.com/item?id=50024528) · [alex0ptr](https://news.ycombinator.com/item?id=50025257) · [aktau](https://news.ycombinator.com/item?id=50019267) · [thomascountz](https://news.ycombinator.com/item?id=50022081) · [&#95;&#95;MatrixMan&#95;&#95;](https://news.ycombinator.com/item?id=50020663) · [deadbunny](https://news.ycombinator.com/item?id=50019198)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50018239>)
