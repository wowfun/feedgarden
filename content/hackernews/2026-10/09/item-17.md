---
publish: true
content_type: "post"
title: "Show HN: Superwhisper S1 mini – Text and tone normalizer for speech-to-text"
description: "Superwhisper released GGUF builds of s1-mini (v1) for llama.cpp, Ollama, LM Studio and other runtimes built on llama.cpp, usable in third-party dictation apps subject to the license. S1-mini is a 0.6B-parameter text normalizer for speech-to"
date: "2026-10-08T18:07:33.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://huggingface.co/superwhisper/s1-mini-GGUF"
discussion_url: "https://news.ycombinator.com/item?id=50009562"
tags: ["source/hackernews","topics/models","topics/inference","topics/products"]
---

## Article

Superwhisper released GGUF builds of s1-mini &#40;v1&#41; for llama.cpp, Ollama, LM Studio and other runtimes built on llama.cpp, usable in third-party dictation apps subject to the license. S1-mini is a 0.6B-parameter text normalizer for speech-to-text output.

It takes a raw ASR transcript and rewrites it as clean written text: fillers removed, false starts and self-corrections resolved to the value the speaker landed on, punctuation and capitalization applied, and spoken numbers, dates, times, currency and email addresses rendered in written form. At Q4&#95;K&#95;M it is a 462 MiB file that runs comfortably on a laptop CPU, and on a held-out set of 7,519 English cases it reaches 94.8% token accuracy. The model is English-only, is not a chat model, and will not follow general instructions; it does one job and is steered with a control line.

- Files: s1-mini-q4&#95;k&#95;m.gguf &#40;Q4&#95;K&#95;M, 462 MB&#41; is recommended and is the build the published accuracy was measured on; s1-mini-f16.gguf &#40;F16, 1.4 GB&#41; is the unquantized intermediate from which the Q4&#95;K&#95;M is produced.
- Both share the same skeleton: architecture qwen3, 311 tensors, 28 blocks, a 40,960-token context window, and an embedded chat template. Q4&#95;K&#95;M keeps the most quantization-sensitive tensors at Q6&#95;K &#40;29 of 311&#41;, the bulk at Q4&#95;K, and normalization parameters at F32 in both builds.

On parameter counts, the Hub sidebar reports 0.8B parameters for this repo. Qwen3-0.6B sets tie&#95;word&#95;embeddings but ships lm&#95;head.weight as a materialized copy of the input embedding, so the 155.6M-parameter embedding is counted twice, giving 751.6M tensor elements against 596.0M unique parameters. Both builds carry that layout unchanged, and Qwen/Qwen3-0.6B reports 0.8B on the Hub for the same reason. The 0.6B figure counts unique parameters.

Every request needs the system prompt and a control line exactly as shown, or the model can hallucinate or produce garbled output. The control line carries three independent, fully cross-trained axes: Styling &#40;casual, semi-casual, semi-formal, formal&#41; sets the register and how much capitalization, apostrophe and contraction cleanup applies; Structure &#40;prose, lists&#41; lets the model break enumerable content into a bulleted list, which needs at least three items, with anything that isn't really a list staying as prose; Context &#40;general, email&#41; selects destination conventions, with email turning on greeting-line and sign-off-block layout. Skipping either the system prompt or control line, or sending values outside the trained sets, is unsupported. Filler-only or noise-only input correctly yields an empty string, so an empty result should be treated as valid rather than a failure.

## Images and video

- [Image: S1-mini banner](<https://huggingface.co/superwhisper/s1-mini-GGUF/resolve/main/banner.jpg>)
