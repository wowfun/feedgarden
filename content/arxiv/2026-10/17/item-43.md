---
publish: true
content_type: "post"
title: "AgentPerturb: Evaluating LLM Agent Robustness under Controlled Interaction Perturbations"
description: "Real-world tasks are complex and noisy, yet existing evaluations lack a systematic framework for jointly characterizing what an LLM agent can be perturbed on and how. AgentPerturb uses this two-dimensional view to conduct a unified study..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21624"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

Real-world tasks are complex and noisy, yet existing evaluations lack a systematic framework for jointly characterizing what an LLM agent can be perturbed on and how. AgentPerturb uses this two-dimensional view to conduct a unified study: it quantifies the robustness of frontier models, traces the mechanisms behind perturbation-induced failures and draws implications for robustness-oriented training.

In controlled evaluations on APEX-Agents and Toolathlon, perturbations consistently degraded performance, while the dominant vulnerabilities varied across task environments. Trajectory-level analysis shows that agents rarely recognize altered inputs and often propagate corrupted information without verification.

A focused cost analysis further shows that successful perturbed trajectories can require substantially more computation than unperturbed ones.

The authors argue these findings motivate training objectives that cover diverse forms of noise and reward verification, uncertainty awareness and recovery. They also provide a benchmark-construction pipeline, with code and data to be released.
