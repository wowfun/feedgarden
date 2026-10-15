---
publish: true
content_type: "post"
title: "Which Skill to Distill? SGUID: Selecting a Compact Skill Bank for Model-Skill Co-Evolution"
description: "Skills are reusable procedural guidance added at inference time that can substantially improve LLM downstream performance. Prior work retrieves skills from a bank by semantic relevance, then uses them as inference-time patches or for mod..."
date: "2026-10-08T17:27:53.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:52.195Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12367v1"
tags: ["source/arxiv","topics/models","topics/research","topics/coding"]
---

Skills are reusable procedural guidance added at inference time that can substantially improve LLM downstream performance. Prior work retrieves skills from a bank by semantic relevance, then uses them as inference-time patches or for model distillation, but largely neglects each skill's individual utility. The authors first show that in on-policy distillation, where skill-conditioned policies serve as teachers, fewer than 25% of retrieved skills provide useful distillation signals.

They propose SGUID, which selects a compact subset of skills for distillation by retaining a skill only if it consistently yields effective learning signals during training; the selected skills are then distilled to produce a better model. Across four models from the Olmo and Qwen families, distilling 6 selected skills matches or exceeds full-bank distillation in mean avg@12 on three of the four models, and on all four after a second round that distills 3 newly selected skills, while the full banks are up to 11x larger.

SGUID also supports stable model-skill co-evolution: after a distillation round, a new candidate bank is curated from the updated model's rollouts and SGUID selects which skills to internalize next. In the second round this loop selects 3 new skills and improves Qwen3-8B from 64.3% to 66.3%. Selection is essential for stability: on Qwen3-4B, naively updating the model with unfiltered skills degrades performance, including a 0.3 percentage point drop on HMMT25, whereas SGUID improves HMMT25 by 0.5 points after the first round and 1.1 points after the second. The authors identify skill selection as the key mechanism for stable model-skill co-evolution.
