---
publish: true
content_type: "post"
title: "All-in-One Memory: Process-Rewarded Reinforcement Learning for Memory Agents"
description: "Large language models increasingly rely on external memory to answer queries grounded in long-horizon histories such as multi-session dialogues and lengthy documents. Existing memory methods often optimize retrieval and memory constructi..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21147"
tags: ["source/arxiv","topics/agent-memory","topics/agents","topics/research"]
---

Large language models increasingly rely on external memory to answer queries grounded in long-horizon histories such as multi-session dialogues and lengthy documents. Existing memory methods often optimize retrieval and memory construction separately, without a shared reward space for evaluating search, writing, and stopping decisions. All-in-One Memory &#40;AiO-Mem&#41; instead organizes these operations as transitions over a shared evidence state and directly evaluates the semantic quality of each action in a unified reward space.

AiO-Mem compiles heterogeneous histories into source-traceable multi-view events, giving retrieval and memory writing a common substrate. A unified memory policy actor then rolls out complete interaction trajectories over this shared evidence state. A separate trajectory-conditioned process reward model is trained through evidence-grounded supervised fine-tuning and trajectory-level DPO to assign process scores to collected trajectories. Those scores are aggregated into an action-balanced trajectory reward, which Process-Aligned DAPO &#40;PA-DAPO&#41; uses to optimize the memory policy.

Across long-context memory benchmarks, AiO-Mem consistently improves answer accuracy over both static memory systems and RL-trained memory agents. The results suggest that jointly rewarding search, writing, and stopping decisions, rather than tuning retrieval and construction in isolation, is a useful direction for memory agents operating over long histories.
