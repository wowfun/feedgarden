---
publish: true
content_type: "post"
title: "ARIA: Runtime Inspection and Amendment for Multi-Agent Systems"
description: "In LLM-based multi-agent systems, a local mistake can propagate as other agents build on it, turning a correctable error into a failed task. The authors argue that diagnosing completed runs, or repeatedly re-executing them to look for fi..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20780"
tags: ["source/arxiv","topics/agents","topics/research"]
---

In LLM-based multi-agent systems, a local mistake can propagate as other agents build on it, turning a correctable error into a failed task. The authors argue that diagnosing completed runs, or repeatedly re-executing them to look for fixes, does not yield a learned policy for intervening while execution is still in progress.

They present Agent Runtime Inspection and Amendment &#40;ARIA&#41;. Its central idea is to turn execution-verified repairs into reusable supervision, moving the search for repairs into data construction and training so a learned model can intervene at runtime without testing alternatives repeatedly. The authors collected more than 24,000 successful and failed trajectories across four multi-agent frameworks, six benchmarks and eight host models. From these they built the ARIA dataset, which they describe as the first large-scale dataset pairing failed multi-agent trajectories with execution-verified repairs. It contains 3,953 verified repair pairs, each stating what went wrong, where to intervene and how execution should continue.

ARIA is designed to work with any multi-agent system that exposes execution trajectories and supports continuation replacement. A compact model is trained on the verified repairs to recognize when intervention is needed and how to correct an ongoing run, with the aim of learning repair strategies that generalize rather than reproducing individual fixes. The authors report strong repair performance in both post-hoc and runtime settings, including generalization to unseen frameworks and host models.
