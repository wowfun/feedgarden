---
publish: true
content_type: "post"
title: "Designing Transformers for Continuous Diffusion Language Models"
description: "Continuous diffusion language models (CDLMs) generate text in parallel rather than token by token, but most work reuses Transformer designs built for causal LLMs or for image diffusion, which were not optimized for this setting. The pape..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22330"
tags: ["source/arxiv","topics/models","topics/research","topics/inference"]
---

Continuous diffusion language models &#40;CDLMs&#41; generate text in parallel rather than token by token, but most work reuses Transformer designs built for causal LLMs or for image diffusion, which were not optimized for this setting. The paper presents a systematic study of Transformer architecture choices for CDLMs and introduces LangDiT.

LangDiT combines feature normalization and query-key normalization, wider noise conditioning, likelihood-shortcut gradient routing with calibration, and confidence-gated training self-conditioning. The authors evaluate it as a plug-and-play backbone for LangFlow, a representative CDLM, and report lower generation perplexity in matched LangFlow comparisons, which they call a new state of the art in continuous language generation across model formulations.

On unconditional generation of 1,024-token sequences from OpenWebText, LangDiT reaches a generation perplexity &#40;GenPPL&#41; of 21.72 with 1,024 function evaluations &#40;NFEs&#41; and 44.72 with 128 NFEs. Adapted to Plaid-style CDLM formulations, it reaches 11.33 GenPPL at 1,024 denoising NFEs and 27.51 at 128 NFEs.

The authors stress that each model's underlying representation, training objective and inference sampler were kept unchanged, so the gains can be attributed to the Transformer architecture itself. The abstract does not report wall-clock speed, model size or comparisons against autoregressive language models; the evidence is perplexity on unconditional generation.
