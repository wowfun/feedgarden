---
publish: true
content_type: "post"
title: "Calculator estimates the real electricity cost of a self-hosted local LLM server"
description: "A Reddit user who has spent many months tuning a local LLM setup shared a browser-based calculator built around the number they say people actually want: the electricity bill for running your own model. The tool takes a GPU's power draw in "
date: "2026-10-09T08:39:14.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1g2kd/how_much_does_your_local_llm_server_really_cost/"
tags: ["source/reddit","topics/inference","topics/hardware"]
---

A Reddit user who has spent many months tuning a local LLM setup shared a browser-based calculator built around the number they say people actually want: the electricity bill for running your own model.

The tool takes a GPU's power draw in watts and its token speed &#40;separately for prompt processing and decode&#41;, combines those with the user's energy price per kilowatt-hour, and reports cost per hour, per request, per month, and per 1 million input tokens — calculated both with and without KV cache. Three GPU presets are included &#40;RTX 4070 Ti Super, RTX 5090, and an RTX 5090 eco profile&#41; so users can start from realistic figures and adjust.

The cached-token model assumes cached tokens take 1/100 the time of uncached ones. The fixed realistic scenario is 60k input tokens, 50k of them cached, 2k output, and 90% uptime. For comparison, each self-hosted profile is measured against a reference cloud API priced at &#36;0.25 per 1M input tokens and &#36;1.20 per 1M output tokens under the same workload, so users can judge whether self-hosting actually saves money.

The author argues the per-request figure is the meaningful one to compare against cloud pricing, since the monthly bill is simply that number multiplied by actual request rate. Everything runs in the browser, with no uploads and no sign-up; the author notes it is one of 139 free tools in a catalog.
