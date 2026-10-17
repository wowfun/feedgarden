---
publish: true
content_type: "post"
title: "Progress Reward Model for Reinforcement Learning via Large Language Models"
description: "PRM4RL is a framework that combines large language model task planning with dense reward generation to address long-horizon reinforcement learning with sparse rewards. The authors argue that traditional RL algorithms struggle with such t..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22056"
tags: ["source/arxiv","topics/agents","topics/research"]
---

PRM4RL is a framework that combines large language model task planning with dense reward generation to address long-horizon reinforcement learning with sparse rewards. The authors argue that traditional RL algorithms struggle with such tasks. Recent work uses LLM world knowledge for task planning and reward generation, but planning-based approaches often depend on predefined skill libraries and fail to optimize low-level control policies, while reward-based methods need extensive human feedback or exhaustive search because tasks are complex. PRM4RL aims to address both sides.

For high-level planning, the framework decomposes a complex task into a series of simple, manageable subtasks and designs a subtask-oriented, fine-grained progress function that monitors execution progress. For low-level reward generation, it draws on potential-based reward shaping: the progress function builds a Progress Reward Model &#40;PRM&#41;, which the authors say provides theoretically grounded optimality and convergence guarantees and enables effective policy optimization.

Experiments on robotics control tasks show the approach outperforming both LLM-based planning and LLM-based reward methods and reaching state-of-the-art performance, according to the authors. The abstract does not report specific benchmark scores, baseline details or improvement margins. Code is available in the deng-ai-lab/PRM4RL repository.
