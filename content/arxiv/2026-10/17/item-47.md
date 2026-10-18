---
publish: true
content_type: "post"
title: "RSIFlow: Adaptive Self-Improvement Workflows with an Evolving Meta-Agent"
description: "RSIFlow is a recursive self-improvement framework that combines adaptive workflow orchestration with evolution of a meta-agent's capabilities. It diagnoses performance bottlenecks from task-agent trajectories and environmental feedback, ..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21791"
tags: ["source/arxiv","topics/agents","topics/agent-self-improvement"]
---

RSIFlow is a recursive self-improvement framework that combines adaptive workflow orchestration with evolution of a meta-agent's capabilities. It diagnoses performance bottlenecks from task-agent trajectories and environmental feedback, then dynamically selects component-specific improvement workflows instead of applying one fixed procedure. The meta-agent distills the outcomes of those workflows into component-specific skills and cross-component principles, and evolves its own harness to improve how later workflows are orchestrated.

The authors evaluate the framework on six benchmarks with two backbone models and report state-of-the-art average performance on all six. Ablation studies indicate that both adaptive workflow orchestration and meta-harness evolution contribute to the gains. The project's code is released publicly. The work targets a limitation of earlier self-improvement methods—model optimization, harness evolution and executable artifact refinement—by also adapting the improvement mechanisms to changing bottlenecks and by using execution feedback to improve orchestration.
