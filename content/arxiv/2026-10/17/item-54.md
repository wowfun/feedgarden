---
publish: true
content_type: "post"
title: "PROBE: Learning to Audit Policy Compliance in Tool-Using LLM Agents"
description: "Modern agentic systems extend language models with external tools so they can complete complex tasks over multi-turn interactions. In consequential deployments they are often constrained by policies covering pricing, privacy, confirmatio..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22124"
tags: ["source/arxiv","topics/agents","topics/evaluation"]
---

Modern agentic systems extend language models with external tools so they can complete complex tasks over multi-turn interactions. In consequential deployments they are often constrained by policies covering pricing, privacy, confirmation, safety and other requirements. The authors identify an evaluation gap: capability benchmarks measure what agents can accomplish, and content-safety red-teaming measures harmful generations, but neither tests whether agents follow predefined policies during otherwise valid tool use. Such violations can be hard to audit because their effects may emerge only after several turns, span multiple tool calls, or surface in downstream systems.

PROBE &#40;Policy Rule Observation via Behavioral Exploration&#41; trains LLM-based auditors to act as realistic users and probe deployed agents for policy violations through multi-turn, tool-mediated dialogue. The method formalizes agent auditing as a two-player Markov game and uses a composite reward balancing violation discovery, behavioral plausibility, conversation progress and policy diversity. The authors compare GRPO, DPO and GFlowNet-based optimization in a controlled setting.

In their experiments, auditors trained with PROBE uncover substantially broader and higher-yield violations than same-architecture zero-shot adversaries, even when the auditor is much smaller than the target agent. The authors argue that multi-turn behavioral auditing is a distinct, necessary axis of agent evaluation alongside capability and safety benchmarks, and suggest a co-evolutionary loop in which auditors expose failures and agents improve from their feedback.
