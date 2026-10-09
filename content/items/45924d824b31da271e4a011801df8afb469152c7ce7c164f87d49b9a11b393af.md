---
publish: true
content_type: "post"
title: "Prior or Feedback? What an LLM Uses When Adapting Neural Operators"
description: "Do LLM scientific agents rely only on their initial task context, or do they adapt decisions in response to experimental feedback? The authors study this in neural operator adaptation, where a large language model selects fine-tuning config"
date: "2026-10-08T17:06:23.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12325v1"
tags: ["source/arxiv","topics/agents","topics/research","topics/evaluation"]
---

Do LLM scientific agents rely only on their initial task context, or do they adapt decisions in response to experimental feedback? The authors study this in neural operator adaptation, where a large language model selects fine-tuning configurations under a limited trial budget.

Across transfers within and between partial differential equation &#40;PDE&#41; families, the LLM achieves lower held-out test nRMSE than random search and Bayesian optimisation in nearly every matched comparison. Endpoint performance alone cannot show what drives this, so the authors verify each attribution with controlled interventions. Before observing any validation score, the LLM's first configuration already ranks near the top of the corresponding random-search pool, indicating a useful initial bias. A complementary cold-start intervention shows the selected base learning rate shifts with the PDE description.

Once feedback becomes available, reassigning validation scores among evaluated configurations changes the next proposal in every case tested, whereas a value-preserving rewrite produces no comparable aggregate effect. These interventions establish that the LLM's decision-level actions respond both to the given task and to observed outcomes — combining a task-dependent prior with sensitivity to experimental feedback.
