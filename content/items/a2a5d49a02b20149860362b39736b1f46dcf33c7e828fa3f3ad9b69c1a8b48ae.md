---
publish: true
content_type: "post"
title: "DLoop: Looped Speculative Decoding"
description: "A new paper, DLoop, targets wasted computation in speculative decoding for large language models. Speculative decoding accelerates autoregressive generation by having a lightweight draft model propose tokens in a drafting stage, which the t"
date: "2026-10-09T07:18:42.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1eu7o/paper_dloop_looped_speculative_decoding/"
tags: ["source/reddit","topics/inference","topics/research"]
---

A new paper, DLoop, targets wasted computation in speculative decoding for large language models.

Speculative decoding accelerates autoregressive generation by having a lightweight draft model propose tokens in a drafting stage, which the target model then verifies. As draft models become more capable, the authors observe that the target model often accepts every token produced in a drafting stage, yet a verification still follows each stage, producing unnecessary target-model forward passes even when drafting could have continued.

Adaptive draft-length methods decide during decoding how many draft tokens precede a verification, but the authors say these raise speedup only for autoregressive draft models. For a parallel draft model, drafting further requires target-model hidden states for draft tokens that have not yet been verified.

DLoop addresses this as a looped form of speculative decoding that performs multiple drafting stages before verification. It keeps drafting while the draft model remains confident and then verifies all accumulated draft tokens together. Loop-aware training keeps the draft model reliable in the additional stages by exposing it to its own hidden states for unverified draft tokens. The approach trades extra draft-model forward passes for fewer target-model forward passes.

Across speculative decoding methods including EAGLE-3, DFlash, Domino, DSpark and multi-token prediction modules, DLoop is reported to improve wall-clock speedup by 5 to 41 percent while preserving lossless decoding. The code is under internal review and will be released soon.

## Images and video

- [Image: &#91;Paper&#93; DLoop: Looped Speculative Decoding](<https://preview.redd.it/qt7fjeyd7euh1.png?width=140&height=72&auto=webp&s=28336cf2022f41d9d09c7311db0f5738931eda30>)
