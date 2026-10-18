---
publish: true
content_type: "post"
title: "Watts If? A Benchmark for Counterfactual Reasoning About the AI Data Center Buildout"
description: "An AI data center is committed years before it draws a watt. A few discrete choices, such as grid power or on-site gas, evaporative or dry cooling, and which county to file in, fix its capital cost, water draw and carbon path. Large lang..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21397"
tags: ["source/arxiv","topics/evaluation","topics/energy"]
---

An AI data center is committed years before it draws a watt. A few discrete choices, such as grid power or on-site gas, evaporative or dry cooling, and which county to file in, fix its capital cost, water draw and carbon path. Large language models are now asked to help screen such decisions, but there has been no test of whether they track what each commitment rules out. DCBench-440 addresses that gap with two arms reported separately.

The generative arm contains 200 questions over STRIPS worlds covering five US deal archetypes, with search-verified gold answers and no tested shortcut above 12% on any question type. The multiple-choice arm contains 240 questions grounded in quoted site records, emission equations and stated scenarios.

Across open-weight deployments, accuracy spans 12.5% to 71.5% on the generative arm and 58.3% to 92.5% on the multiple-choice arm. One skill fails everywhere: when asked to list every action available at a decision gate, no model exceeds 4.0% exact match. The strongest models list 72% to 85% of the actions that would change the project's state but omit most permitted actions that change nothing; with those excused, the best exact match is still 24%.
