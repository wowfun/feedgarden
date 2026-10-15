---
publish: true
content_type: "post"
title: "RISEBench++: Benchmarking Reasoning-Informed Visual Editing"
description: "Large multi-modality models have advanced in visual understanding and generation, but visual editing remains difficult: following complex instructions, preserving appearance consistency and supporting flexible input formats are all chall..."
date: "2026-10-08T17:15:58.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:59.851Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12343v1"
tags: ["source/arxiv","topics/evaluation","topics/models","topics/agents"]
---

Large multi-modality models have advanced in visual understanding and generation, but visual editing remains difficult: following complex instructions, preserving appearance consistency and supporting flexible input formats are all challenging. To study this gap, the authors introduce RISEBench, described as the first benchmark for Reasoning-Informed viSual Editing &#40;RISE&#41;, and extend it to RISEBench++, a more comprehensive and fine-grained benchmark.

RISEBench++ expands the taxonomy into a hierarchical scheme with six reasoning dimensions: temporal, causal, spatial, logical and counterfactual reasoning, plus hybrid reasoning that integrates multiple reasoning types across multi-turn edits. These are decomposed into 12 subcategories and 65 fine-grained task types. Input formats are expanded to include multi-image conditioning, and the benchmark scales to 1,000 human-annotated test cases released in English and Chinese. The evaluation framework assesses instruction reasoning, appearance consistency and visual plausibility using human judges and an LMM-as-a-judge approach.

Beyond benchmarking, the authors present RISE-Agent, a training-free agentic framework combining reasoning-driven planning, tool-augmented execution and verifier-guided refinement. They evaluate 58 visual editing approaches: 34 open-source models, 19 closed-source models and 5 agentic methods. The results show substantial difficulty in reasoning-based visual editing, with even the strongest evaluated approach, GPT-Image-2.5 Sunburst, reaching only 56.6% accuracy.
