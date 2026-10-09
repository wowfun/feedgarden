---
publish: true
content_type: "post"
title: "What are you using for NVFP4, and do you like it?"
description: "A user running NVFP4 quantized models across multiple GPUs asks what others are using, saying the only setup they can get working is Unsloth. vLLM is described as too slow and taking very long to load, while TensorRT-LLM is said to have too"
date: "2026-10-08T18:38:24.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0yxrf/what_are_you_using_for_nvfp4_and_do_you_like_it/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/models"]
---

A user running NVFP4 quantized models across multiple GPUs asks what others are using, saying the only setup they can get working is Unsloth. vLLM is described as too slow and taking very long to load, while TensorRT-LLM is said to have too many issues.

They ask how NVFP4 compares with Q4 GGUF for a Qwen 3.8-class model, and whether NVFP4 sits closer to Q6 GGUF than Q4 GGUF does.

They tested a Qwen3.8-27B NVFP4 model &#40;neroued/Qwen3.8-27B-nvfp4-NInfer&#41; with the neroued/ninfer runtime. Initial testing was described as not great for code, while vision and tool calling were called very impressive. On complex scenes, brief testing looked slightly better than their experience with Q6 GGUF, but they plan to revisit after spending a lot of time wiring ninfer into their frontend.

Speed on 2x5060ti was called fantastic, with 197k context and model loading in 4-6 seconds. The poster notes this is early, qualitative testing with no benchmark numbers, and that subjective impressions may change on a second look.
