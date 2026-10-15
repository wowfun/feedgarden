---
publish: true
content_type: "post"
title: "LLM-BlockFE: Turning Long Text into Executable Feature Programs with LLM-Guided Search"
description: "Industrial risk-control systems usually predict with structured-data models, but much of the useful signal lives in unstructured long text. Manually engineering features from that text is labor-intensive, and calling a large language mod..."
date: "2026-10-08T17:39:11.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:52.195Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12390v1"
tags: ["source/arxiv","topics/models","topics/research"]
---

Industrial risk-control systems usually predict with structured-data models, but much of the useful signal lives in unstructured long text. Manually engineering features from that text is labor-intensive, and calling a large language model for every real-time input may not meet production deployment needs. The authors propose LLM-BlockFE, an LLM-guided offline framework that converts long text into executable feature programs so that no LLM calls are needed during online inference.

LLM-BlockFE builds feature programs by incrementally appending immutable code blocks and scoring candidate features with a downstream model. To avoid the suboptimal solutions that conventional greedy search tends to reach, it adds a block-level rollback mechanism based on depth-calibrated credit allocation, and advances several independent search trajectories in an interleaved way, sharing fixed descriptions of each trajectory's exploration direction to cut redundant exploration. After search, the resulting programs are frozen and deployed to extract structured features for downstream predictors.

Across two public and two private datasets, LLM-BlockFE improves absolute AUC by 0.0069 to 0.0358 over the strongest baseline on each dataset in full-dataset comparisons. Post-launch monitoring across five deployed financial risk-control applications reports absolute KS gains of 0.02 to 1.56 percentage points over the existing manually designed strategy, suggesting the offline-constructed features transfer to live systems.
