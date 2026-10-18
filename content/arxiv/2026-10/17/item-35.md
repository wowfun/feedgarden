---
publish: true
content_type: "post"
title: "Computing attention statistics inside the FlashAttention pass for compact hallucination detectors"
description: "Large language models can produce fluent answers that the supplied context does not support. A compact frozen proxy model can detect such answers by reading the context and another model's response, even when the generator is proprietary..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21483"
tags: ["source/arxiv","topics/hallucination-detection","topics/evaluation","topics/inference"]
---

Large language models can produce fluent answers that the supplied context does not support. A compact frozen proxy model can detect such answers by reading the context and another model's response, even when the generator is proprietary. Attention-based detectors use summary statistics of the proxy's attention weights, but standard pipelines materialize the attention matrix, whose memory grows quadratically with sequence length.

The authors compute these statistics without materializing attention, using three routes: accumulation during the FlashAttention pass, sparse lookups after it, or a second tiled pass over the scores. They classify the statistics by this path into nearly free and costlier ones. On an H100, statistics for five published detectors add 16% to the latency of a Qwen3-8B forward pass at 2K tokens, falling to 1.4% at 35K tokens, and store 22.5 KiB per response token.

On three benchmarks, probes trained on frozen Qwen3 proxies of 0.6B to 8B parameters prove strong detectors. A 4B proxy outperforms the strongest of nine zero-shot LLM judges of 4-9B parameters in F1 on two of the three benchmarks, and the proxies match or outperform specialized grounding checkers of up to 7B parameters. Probing each proxy beats prompting it as a judge, and adding attention features significantly improves F1 in half of the 12 benchmark-proxy pairs while never significantly lowering it. The practical upshot is that attention-based hallucination detection can run at low overhead on top of an existing forward pass, using frozen models rather than access to the generator's internals.
