---
publish: true
content_type: "post"
title: "ARGUS: An Agenda-Driven Framework for Reliable User Simulation"
description: "High-fidelity user simulators are important for evaluating and training agents in interactive environments, but current LLM-based simulators have reliability problems such as omitting goals and failing to comply with policies. ARGUS (Age..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21346"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

High-fidelity user simulators are important for evaluating and training agents in interactive environments, but current LLM-based simulators have reliability problems such as omitting goals and failing to comply with policies. ARGUS &#40;Agenda-dRiven Goal-oriented User Simulator&#41; is a neuro-symbolic framework that keeps the user's goal state in a dynamic agenda stack manipulated through symbolic operations.

By strictly decoupling state tracking from natural language generation, ARGUS supports strict goal progression and interactions that stay aligned with constraints. For cost-efficient deployment, the authors distill it into compact models with a unified pipeline: evaluator-guided supervised fine-tuning followed by online reinforcement learning with dense step-level rewards.

To assess behavioural fidelity more rigorously, they introduce a rubric-based metric called the Composite Behavioral Score &#40;CBS&#41;. Evaluations on tau^3-Bench and MultiWOZ show that the ARGUS architecture is significantly superior and that the training pipeline is effective. The authors say code and data will be released soon.
