---
publish: true
content_type: "post"
title: "Developer builds prompt-cache-lens to find the characters that silently break Anthropic prompt caching"
description: "A developer (/u/skeletonita) describes diagnosing a 0% prompt cache hit rate with no error messages and building an open-source tool, prompt-cache-lens, to locate the exact cause. The post states that prompt caching can cut Claude input tok"
date: "2026-10-09T14:09:37.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1mdl5/prompt_caching_gave_us_a_0_hit_rate_without/"
tags: ["source/reddit","topics/inference","topics/coding"]
---

A developer &#40;/u/skeletonita&#41; describes diagnosing a 0% prompt cache hit rate with no error messages and building an open-source tool, prompt-cache-lens, to locate the exact cause. The post states that prompt caching can cut Claude input token costs by up to 90–95%, down to &#36;0.10 per million tokens on Sonnet 5.5, but that it requires a 100% exact prefix match.

According to the post, when a cache misses, the Anthropic API does not raise an error: it returns cache&#95;read&#95;input&#95;tokens: 0, charges full price, and adds 3–5 seconds of prefill latency. Listed culprits that routinely break the prefix include dynamic timestamps or dates injected into system instructions &#40;for example "Current time: ..."&#41;, tools defined with fluctuating key order or unsorted JSON schemas, Windows &#92;r&#92;n versus Unix &#92;n line endings in prompt templates, and ephemeral cache breakpoints set on prefixes shorter than Anthropic's minimum 1,024-token requirement.

The tool is described as a zero-dependency CLI and local proxy with three functions. A CLI diff mode compares two turn files, visualizes the exact token where the prefix severed, highlights the root cause, and computes the money lost per request. A live proxy mode forwards traffic to the Anthropic API endpoint so a client's base URL can be pointed at it to observe hit rates and break points while chatting. An interactive demo simulates three common failure scenarios in the terminal. It is published on GitHub and npm under the author's account; the post reports no independent validation of the tool's detection accuracy.
