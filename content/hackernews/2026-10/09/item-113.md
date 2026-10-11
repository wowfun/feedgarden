---
publish: true
content_type: "post"
title: "Show HN: Long-term memory and a 50M-token window for LLMs via stored KV state"
description: "The post describes a memory layer, distributed as the public package galahad-kv, that saves the key-value (KV) state of each block of roughly 16,000 tokens to encrypted local NVMe disk and later loads it back byte-exact instead of recomputi"
date: "2026-10-09T09:35:33.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://huggingface.co/papers/2610.10845"
discussion_url: "https://news.ycombinator.com/item?id=50018178"
tags: ["source/hackernews","topics/inference","topics/models","topics/open-source"]
---

## Article

The post describes a memory layer, distributed as the public package galahad-kv, that saves the key-value &#40;KV&#41; state of each block of roughly 16,000 tokens to encrypted local NVMe disk and later loads it back byte-exact instead of recomputing it. The motivation is that a model can only use text fitting its context window, and it normally recomputes KV state for a prompt on every send.

The authors ran the memory layer on 50,000,000 tokens of real public text, served through vLLM on a single NVIDIA H100, with Gemma 4 12B and Gemma 4 31B. Every block probed was reloaded from the encrypted store with no recompute &#40;100 of 100, at depths from 0 to 50M tokens&#41; on both models. Loading a block was reported as 2.8x to 4.3x faster than recomputing it and used 8.8x to 12.3x less GPU energy, while GPU memory stayed flat across the whole 50M-token stream. Asked about facts planted millions of tokens earlier, the 12B model answered correctly 82 times out of 100 and the 31B model 98 times out of 100; neither model produced an invented answer.

The stated limits are that this is reuse of stored state rather than a wider attention window: only one block is loaded at a time, and answer quality depends on the model. Writing the memory is a one-time cost, and the store requires terabytes of local NVMe disk. The authors describe a test protocol designed to resist common ways of gaming long-context benchmarks, and offer a single-GPU reproduction using public software plus a free licence for the package.

## HN discussion

Based on 1 selected comments and replies.

One commenter, Wetime, points to the project's GitHub repository, github.com/corbenicai/galahad, and notes that it is free to use for 1 GPU. That is the only supplied comment, so it adds a practical pointer rather than any independent evaluation of the reported numbers.

Selected comments: [Wetime](https://news.ycombinator.com/item?id=50019751)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50018178>)
