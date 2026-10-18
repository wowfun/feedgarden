---
publish: true
content_type: "post"
title: "The World Won't Wait: Evaluating and Teaching Agents Under a Live Clock"
description: "The paper argues that LLM agents can solve complex interactive tasks, but their reasoning and tool calls take time, so an otherwise correct action may arrive too late in a changing environment. To measure this problem, the authors introd..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20665"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

The paper argues that LLM agents can solve complex interactive tasks, but their reasoning and tool calls take time, so an otherwise correct action may arrive too late in a changing environment. To measure this problem, the authors introduce RealtimeBench, a set of 180 tasks across six game types in which the games keep running during model inference. The setup makes timeliness part of the evaluation, not only action correctness.

Paired evaluations illustrate the trade-off: GPT-6.1-sol outperforms the faster Jev when games are paused, but falls behind when they continue running. The contrast shows that paused and running conditions can rank agents differently. The authors then propose Two-Timescale Offline Recursive Self-Improvement &#40;TORSI&#41;. A slow teacher studies failures and tests corrections in paused games between attempts, then writes reusable instructions for a fast student. During gameplay the student acts without calling the teacher, and validation scores decide which updates are adopted.

Two rounds raised Jev's average test score from 13.51 to 24.19 on a 0–100 progress scale, improving all six game types. The resulting instructions also raised average scores for three other models without retuning. The authors frame these results as a step toward real-time intelligence, in which deliberation, learning and action are organized across different timescales.
