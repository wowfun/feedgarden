---
publish: true
content_type: "post"
title: "Telperion releases latent-attention Qwen3.8-27B variants with 4x smaller KV cache"
description: "Telperion announced two latent-attention variants of Qwen3.8-27B: MLA (multi-head latent attention) and GLA-g2, a grouped latent version using two groups. Both target 4x KV cache compression, described as enabling roughly 4x more maximum..."
date: "2026-10-14T16:47:46.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x5wcnz/new_model_from_telperion_qwen3827bmla/"
tags: ["source/reddit","topics/models","topics/inference","topics/research"]
---

Telperion announced two latent-attention variants of Qwen3.8-27B: MLA &#40;multi-head latent attention&#41; and GLA-g2, a grouped latent version using two groups. Both target 4x KV cache compression, described as enabling roughly 4x more maximum context on consumer hardware or near 4x more concurrency on servers.

Reported results on SWE-bench Verified &#40;zero-shot, toolless, n &gt; 1500&#41;: the MLA variant scores 42.1%, versus 39.5% for base Qwen3.8-27B and 39.4% for GLA-g2. Telperion calls the MLA gain a statistically distinguishable +6.58% improvement. On mean output tokens the variants use less: MLA 0.88x and GLA-g2 0.86x of the base, framed as up to 20% fewer reasoning tokens. KV compression is listed as 4.00x at TP=1 and 2.28x at TP=2 for MLA, and 4.00x at both TP=1 and TP=2 for GLA-g2; the grouped design exists because serving MLA on multi-GPU devices has memory downsides.

The team also published post-training quantized versions with measured memory and top-1 disagreement versus BF16: BF16 uses 55.7GB &#40;memory includes the MTP head and vision encoder&#41;, FP8 31.5GB with 0.06% disagreement, INT4 22.9GB with 0.17%, and EXL3-4.0bwp 17.2GB with 0.46% disagreement. Telperion says its quants exceed equivalently sized .gguf quants in fidelity.

A vLLM plugin is offered for easy installation and was verified on RTX PRO 6000s, H100s and 2x RTX 5060Ti 16GB. Telperion states the method needs zero retraining and is compatible with almost any model using grouped query attention or similar variants, and says it will open source the method soon. A version 2 with a full benchmark suite is planned when more compute is available, along with sparse latent attention variants of Qwen4-27B when that model is released.

Caveat: all figures come from the developer's own announcement and benchmark table; independent replication is not reported.
