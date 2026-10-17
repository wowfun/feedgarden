---
publish: true
content_type: "post"
title: "Co-Evolving Acting and Forecasting for Language Agents"
description: "Training language agents is bottlenecked by the high cost of long-horizon rollouts, yet standard agentic reinforcement learning learns only from a terminal scalar reward, leaving intermediate-step supervision largely unused. Prior work e..."
date: "2026-10-14T17:59:28.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20597v1"
tags: ["source/arxiv","topics/agents","topics/models","topics/research"]
---

Training language agents is bottlenecked by the high cost of long-horizon rollouts, yet standard agentic reinforcement learning learns only from a terminal scalar reward, leaving intermediate-step supervision largely unused. Prior work exploits that supervision via value targets estimating per-step success probabilities or observation targets fitting environment responses. Both are hard to build well: value targets come from the same single scalar signal at each step, and observation targets such as web pages and terminal logs are long, noisy and reach only one step ahead.

The authors propose CoPE, which adds a third kind of target - multi-step action targets. On successful on-policy trajectories, CoPE trains the policy backbone to generate the action sequences that follow each history. Each action is also supervised when forecast from preceding histories, forming a temporal ensemble that the shared backbone absorbs during training, letting acting and forecasting co-evolve. At inference the policy still acts one step at a time, with no overhead.

Across five benchmarks &#40;ALFWorld, ScienceWorld, WebShop, τ²-bench and AppWorld&#41;, CoPE achieves stronger aggregate performance than GRPO and RL baselines with predictive auxiliary targets in simulated environments, while improving overall performance on both realistic applications. It delivers up to 1.9× and 2.0× higher sample efficiency than ECHO and GRPO respectively on ScienceWorld. Gains come with a single policy backbone, without additional models, separate pretraining or inference overhead. Codebase is available on GitHub.
