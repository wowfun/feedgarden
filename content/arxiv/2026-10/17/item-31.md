---
publish: true
content_type: "post"
title: "Localized Context Distillation trains students only on the trajectory spans that need revision"
description: "Learning from interaction experience is essential if large language models are to keep improving during deployment. Context distillation is a promising route: privileged information extracted from experience is given to a teacher, whose ..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21427"
tags: ["source/arxiv","topics/models","topics/research"]
---

Learning from interaction experience is essential if large language models are to keep improving during deployment. Context distillation is a promising route: privileged information extracted from experience is given to a teacher, whose behavior is then distilled into a student that never sees it. The authors argue that both existing forms have drawbacks. Off-policy context distillation trains the student on teacher-generated trajectories and therefore suffers from exposure bias, while on-policy context distillation trains on the student's own rollouts, whose states are often uninformative and fail to convey behaviors the student cannot yet produce.

Localized Context Distillation &#40;LoCD&#41; is proposed to resolve this dilemma. It first localizes the critical spans of a student trajectory that require revision. The teacher then regenerates only those spans, conditioned on the student's own prefix, and the student is trained on the regenerated segments. This concentrates learning on the most informative states while keeping exposure bias low, because training stays anchored to the student's own trajectory rather than a fully teacher-generated one.

The authors report extensive experiments in math reasoning, code generation and agent tasks. LoCD consistently outperforms strong baselines and trains more stably, with smaller and sparser parameter updates. The abstract does not report benchmark-level scores, so the strength of the gains is not quantified here. The method's practical appeal is that it reuses experience without discarding the student's own distribution, which matters for continual improvement after deployment.
