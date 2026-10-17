---
publish: true
content_type: "post"
title: "LFM2.5-24B-A2B: Built for fast on-device agents"
description: "sebmellen called the advertised throughput impressive, citing up to 1.7x faster than comparable MoEs on-device, 184 tokens/s on an Apple M5 Max and up to 21K output tokens/s on a single NVIDIA B300, but said it is unclear what Automation..."
date: "2026-10-14T23:59:37.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://www.liquid.ai/blog/lfm2-5-24b-a2b"
discussion_url: "https://news.ycombinator.com/item?id=50097369"
tags: ["source/hackernews","topics/models","topics/agents","topics/inference"]
---

## HN discussion

Based on 10 selected comments and replies.

sebmellen called the advertised throughput impressive, citing up to 1.7x faster than comparable MoEs on-device, 184 tokens/s on an Apple M5 Max and up to 21K output tokens/s on a single NVIDIA B300, but said it is unclear what AutomationBench actually measures, since the model looks close to other local models elsewhere.

hypfer reported the model is very fast on a 4090 but "also very stupid", which he called a dangerous combination because it will delete production work at 250 tokens/s. Tuna-Fish replied that if an agent has privileges to delete production, the model's intelligence is not the problem.

sorenjan asked how people actually use locally trained agentic models: as an assistant, as a fast orchestrator calling coding subagents, or alongside hosted models. james2doyle said trying it through OpenRouter in OpenCode to follow a larger model's plan went poorly, with many stuck tool calls, and hoped system-prompt tweaks might help.

MatthiasPortzel, previously on Gemma 4 12B, planned to test an Unsloth quantization, and flagged a questionably enforceable non-commercial clause in the license.

Selected comments: [sebmellen](https://news.ycombinator.com/item?id=50097492) · [hypfer](https://news.ycombinator.com/item?id=50101497) · [Tuna-Fish](https://news.ycombinator.com/item?id=50101799) · [sorenjan](https://news.ycombinator.com/item?id=50103653) · [james2doyle](https://news.ycombinator.com/item?id=50104032) · [MatthiasPortzel](https://news.ycombinator.com/item?id=50098829)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50097369>)
