---
publish: true
content_type: "post"
title: "Zellige AI releases Tessera-27B-B-CJK, a Qwen3.8-27B coding agent that thinks in compressed CJK"
description: "Zellige AI released Tessera-27B-B-CJK, the first model in its \"Tessera\" lineup, an Apache-2.0 open-weights tune of Qwen3.8-27B aimed at saving tokens in agent loops. The core idea: agent loops pay for thinking on every turn, so the model..."
date: "2026-10-14T17:35:08.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x5xm28/tessera27bbcjk_zellige_ais_new_finetune_of_qwen/"
tags: ["source/reddit","topics/models","topics/coding","topics/agents"]
---

Zellige AI released Tessera-27B-B-CJK, the first model in its "Tessera" lineup, an Apache-2.0 open-weights tune of Qwen3.8-27B aimed at saving tokens in agent loops. The core idea: agent loops pay for thinking on every turn, so the model is trained to think less and to think in "compressed CJK," a shorthand mixing English, Chinese words and symbols. Thinking and output are kept separate — reasoning happens in the shorthand while answers and tool calls stay in plain English and code, so the harness sees normal output. The author compares it to Bottlecap AI's thinkingcap and says Tessera models plan to push further on token efficiency.

Example: on one real held-out turn with 27 tokens before two tool calls, the reasoning read roughly "check the &#96;linter&#96; package; check &#96;FileWalker&#96;; check how the checker registers in the &#96;checkers&#96; package." The base model spent 137 tokens on the same step; the post says this turn was shorter than most and that a typical turn is about half.

Numbers, all against untuned Qwen3.8-27B on the same inputs, 11 held-out coding-agent tasks at xhigh effort: 0.50–0.64x the base model's thinking tokens per agent turn &#40;typical turn 0.496x, 90% CI 0.385–0.624; token-weighted 0.644x&#41;; 100% valid tool calls and 0 repetition loops across 88 matched turns, the same as base; and 6 of 6 valid tool calls on prompts of 101K–131K tokens, with fewer tests at 131K+ where results still held up.

The post states it is built for agent loops: for competition math and hard algorithmic code, users should stick with the base, since Tessera scores lower there and loops more. Only the bf16 model was evaluated; GGUF and NVFP4 files are untested.

Training used four short LoRA steps on Tinker, all built from the base model's own outputs: rewriting its thinks into compressed CJK for a seed SFT, adding a token-level anti-loop fix, agentic SFT, then a rejection-sampling pass on its shortest clean rollouts. Merged bf16 weights and LoRA, GGUF and NVFP4 versions are downloadable from the linked Hugging Face repo, alongside a paper.

## Media

![Image: Tessera-27B-B-CJK, Zellige AIs new finetune of Qwen with novel approaches to how we think about token savings](<https://preview.redd.it/6p5glarlxgvh1.jpeg?width=640&crop=smart&auto=webp&s=032776dbc50ea5d34856df85fff6a9f2236c3be6>)

[Image: Tessera-27B-B-CJK, Zellige AIs new finetune of Qwen with novel approaches to how we think about token savings](<https://preview.redd.it/6p5glarlxgvh1.jpeg?width=640&crop=smart&auto=webp&s=032776dbc50ea5d34856df85fff6a9f2236c3be6>)
