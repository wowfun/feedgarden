---
publish: true
content_type: "post"
title: "Overcoming Prior Barriers: Supervised Fine-Tuning under Long-Tail Distribution"
description: "Supervised fine-tuning (SFT) adapts pretrained large language models to downstream tasks, but the concepts a task needs receive very different levels of pretrained support: frequent concepts are more likely to be well learned, while rare..."
date: "2026-10-08T17:16:45.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12345v1"
tags: ["source/arxiv","topics/models","topics/research","topics/evaluation"]
---

Supervised fine-tuning &#40;SFT&#41; adapts pretrained large language models to downstream tasks, but the concepts a task needs receive very different levels of pretrained support: frequent concepts are more likely to be well learned, while rare concepts may remain weakly represented. The authors introduce the notion of a prior barrier to quantify how strongly the pretrained model supports competing concepts over the target concept. They observe that prior barriers follow a long-tail distribution, placing head and tail concepts at different starting points for SFT: head concepts face lower prior barriers, while tail concepts need additional instructions to overcome higher ones.

Theoretical analysis derives a predictive risk bound for SFT under long-tail prior barriers, explicitly characterizing how the prior barrier and accumulated SFT evidence jointly determine predictive performance.

Motivated by this prior-barrier-dependent demand, the authors propose PASS, an adaptive SFT instruction selection method. PASS constructs reference-derived concepts, estimates the distinguishing evidence each instruction provides, and adaptively allocates the selection budget toward concepts that remain insufficiently covered by the current selection — jointly considering which instructions supply useful evidence and where additional supervision is needed under a limited budget. Experiments show PASS consistently outperforms seven state-of-the-art instruction selection methods across four backbone-budget settings, and an ablation shows its adaptive allocation consistently improves over uniform allocation.
