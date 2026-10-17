---
publish: true
content_type: "post"
title: "When Reasoning Is Not Enough: Proactive Inquiry for Cross-Modal Safety in Multimodal Large Language Models"
description: "Multimodal large language models (MLLMs) can behave unsafely when images and texts that are individually benign are interpreted together. The authors distinguish implicit reasoning risk, where reasoning drifts toward harm, from intent-le..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22068"
tags: ["source/arxiv","topics/ai-safety","topics/models"]
---

Multimodal large language models &#40;MLLMs&#41; can behave unsafely when images and texts that are individually benign are interpreted together. The authors distinguish implicit reasoning risk, where reasoning drifts toward harm, from intent-level risk, where cross-modal ambiguity silently commits the model to a hazardous premise that path-level optimization alone cannot correct.

SAFE-PRO introduces a Risk-Conditioned Uncertainty &#40;RCU&#41; signal that combines predictive entropy with a learned cross-modal risk score. RCU decides when the model should ask safety-grounded clarifying questions and where to apply path optimization, using a reward that prioritizes safety while penalizing over-refusal. The authors also build SSUI-Dialog, a multimodal multi-turn dataset with dual-intent supervision, and theoretically analyze gradient variance and unsafe-completion risk under RCU.

Across seven benchmarks and two base MLLMs, SAFE-PRO consistently improves safety over SRPO, roughly halves SRPO's over-refusal, and surpasses GPT-4o and Claude-3.5-Sonnet in average single-turn safety, according to the paper. These are the authors' reported results; the abstract does not give per-benchmark scores or dataset sizes.
