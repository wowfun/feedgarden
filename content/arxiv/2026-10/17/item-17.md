---
publish: true
content_type: "post"
title: "AutoOnboarder: Autonomously Onboarding LLM Agents"
description: "Agentic large language models have been documented to lose reasoning capability when placed inside a harness, the software that mediates their observations and actions. AutoOnboarder is an autonomous system that adapts an agent to a task..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21218"
tags: ["source/arxiv","topics/agents","topics/coding"]
---

Agentic large language models have been documented to lose reasoning capability when placed inside a harness, the software that mediates their observations and actions. AutoOnboarder is an autonomous system that adapts an agent to a task the way a trainer onboards a new employee. It places the agent under the supervision of an intelligent "Onboarder" coding agent, which iteratively tailors its foundation model, prompt, and harness source code to improve performance and decrease cost.

Like a real onboarding process, the Onboarder receives only tens of examples, and all evaluation data is isolated on a separate virtual machine to prevent leakage. The authors report lessons from building and testing AutoOnboarder on genomic-sequencing prior authorization form submission. Autonomously onboarded agents match or exceed the performance of a Gemini 3.5 Flash baseline at up to 29 times lower cost.

The agents remain imperfect, however, and the onboarding process varies greatly in final performance. The authors conclude that future onboarding systems require a robust environment for the Onboarder, including a structured thought interface, controlled internet access, and a wide model search space. The work illustrates both the promise of automated agent adaptation and the variance that remains when an agent must tune a model, prompts, and harness code together from limited examples.
