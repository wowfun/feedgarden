---
publish: true
content_type: "post"
title: "MemScope: Evolving Agent Memory Architectures through Localized Code Repair"
description: "Agent memory architectures define how LLM agents store and reuse experience across tasks, but they are typically fixed after deployment, limiting adaptability across task types. Recent self-evolving approaches adapt these architectures u..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21170"
tags: ["source/arxiv","topics/agent-memory","topics/agents","topics/coding"]
---

Agent memory architectures define how LLM agents store and reuse experience across tasks, but they are typically fixed after deployment, limiting adaptability across task types. Recent self-evolving approaches adapt these architectures using execution feedback, usually represented as evaluation scores or compressed summaries. Such coarse-grained feedback is insufficient for precise failure localization in current agent systems, where long-horizon execution involves multiple interacting components. Without a precise failure location, there is no clear code-level target for modification, so the update scope is weakly constrained and often leads to large-scale rewrites of an otherwise capable memory architecture.

MemScope is a framework for evidence-grounded, localized evolution of an existing memory architecture. Its tool-using Patch Agent jointly inspects raw execution traces, runtime memory state, and current architecture code to identify repair targets and apply bounded, in-place edits under provider-identity and memory-compatibility constraints.

On GAIA, the trace-and-memory inspection variant achieves 86.67% accuracy, compared with 70.00% for trace-only and 63.33% for summary-only feedback. On xBench, the evolved architecture improves from 49 to 55 correct answers with DeepSeek V3.2 and from 50 to 53 with Kimi K2.7 Code. On disjoint unseen ALFWorld tasks, success rises from 50.75% to 71.64%. Across archived architecture-snapshot transitions, the median code-change ratio is 4.4%, supporting fine-grained execution evidence as a basis for localized, in-place memory-architecture evolution.
