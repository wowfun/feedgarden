---
publish: true
content_type: "post"
title: "Self-Guided LLM Reasoning for Error Diagnosis in Vehicle Routing Problems"
description: "Vehicle routing problems (VRPs) are fundamental to many real-world applications, and recent large language model advances have spurred progress on these NP-hard problems. Most existing approaches, however, assume that input instances are..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21393"
tags: ["source/arxiv","topics/models","topics/research"]
---

Vehicle routing problems &#40;VRPs&#41; are fundamental to many real-world applications, and recent large language model advances have spurred progress on these NP-hard problems. Most existing approaches, however, assume that input instances are error-free and neglect faults commonly found in real-world data.

This work systematically studies whether LLMs can detect and correct errors in VRP instances, and identifies key limitations, particularly on complex instances or errors that substantially increase the model's reasoning burden. To address them, the authors propose a self-guided reasoning framework in which LLMs autonomously generate code that provides structured insights to aid error diagnosis.

Experiments across diverse problem settings and LLMs show that the framework significantly improves error detection, achieving near-perfect accuracy.
