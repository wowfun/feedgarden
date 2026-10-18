---
publish: true
content_type: "post"
title: "MLExpert: Towards a Generalist Agentic Model for Autonomous Machine Learning Engineering"
description: "Machine learning engineering (MLE) agents can run long experiments and adapt their optimization strategy from execution feedback, a step toward AI systems that improve AI systems. The problem is credit assignment: each result reflects ma..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22344"
tags: ["source/arxiv","topics/agents","topics/agent-self-improvement","topics/models"]
---

Machine learning engineering &#40;MLE&#41; agents can run long experiments and adapt their optimization strategy from execution feedback, a step toward AI systems that improve AI systems. The problem is credit assignment: each result reflects many earlier decisions, and a long run contains many costly experiments, so training must select useful supervision from long interaction trajectories and learn from intermediate outcomes.

The authors propose a post-training method for autonomous long-horizon MLE optimization and use it to train MLExpert, a 35B Mixture-of-Experts agentic model. They build the Kaggle-MLE Factory to construct executable tasks and an interaction harness for model-directed experimentation. Hierarchical agentic supervised fine-tuning transfers general tool-use and coding ability to MLE through outcome-guided supervision. Windowed Interaction RL &#40;WIRL&#41; treats the multi-turn decisions between successive experiment results as an execution window and gives the window a shared outcome-based reward. Asynchronous collection and policy correction allow policy updates before a trajectory ends.

On MLE-Bench Lite, MLExpert raises the base model's average medal rate from 37.9% to 72.7%, a level the authors describe as comparable to larger frontier models such as Kimi-K3 and GLM-5.3. They also report gains on NatureBench Lite, agent scaffold optimization and algorithm optimization, suggesting the learned optimization ability generalizes to other tasks.

The abstract does not give training compute, data volumes or per-task results.
