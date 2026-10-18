---
publish: true
content_type: "post"
title: "JevAgentHarness delegates agent decisions to small models with a fitted confidence threshold"
description: "LLM agent harnesses, the programs that run agents, typically call a large model at every step, which makes long tasks slow and expensive. Many of those calls end in a multiple-choice decision, such as which tool to invoke next. Decision ..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21412"
tags: ["source/arxiv","topics/agents","topics/inference"]
---

LLM agent harnesses, the programs that run agents, typically call a large model at every step, which makes long tasks slow and expensive. Many of those calls end in a multiple-choice decision, such as which tool to invoke next. Decision models like Jev answer such questions directly at a fraction of an LLM call's time and price. This work asks how a harness can delegate those choices with little loss of task success.

To evaluate decision models in agentic settings, the authors build AgentDecisionBench, which spans isolated questions through control of a running agent, using public benchmarks and a new DecisionGym environment. The results show that accuracy on isolated questions does not transfer: the most accurate decision model on those questions solved only 69.5% of agent tasks, and without a fitted confidence threshold, delegating tool choices lowered success by 19.0 percentage points.

JevAgentHarness therefore fits that threshold for each choice on the agent's own trajectories and lets the LLM decide whenever confidence falls below it. Because existing decision models never see the states an agent reaches after its own mistakes, the authors train AgentDecision-4B, an open 4B model, on such states using Jev's answers as labels. On tasks unlike its training data, the agent solved 91.5% of them with AgentDecision-4B versus 82.0% with Jev. On tasks resembling their training data, 4B models trained this way made agents 81.1-89.0% cheaper and up to 2.5 times faster without losing 3 or more points of task success. Models, data and harness are to be released.
