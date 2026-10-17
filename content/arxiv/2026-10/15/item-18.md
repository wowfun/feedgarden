---
publish: true
content_type: "post"
title: "Manacá-1B-Instruct-2: Reproducible Safety Alignment for a Native Brazilian-Portuguese LLM"
description: "Brazilian Portuguese remains underserved by open-source language models, and the few that are safety-aligned rarely document what did not work or validate comparisons with statistical significance. The paper presents Manacá-1B-Instruct-2..."
date: "2026-10-14T17:53:46.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:35.641Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20570v1"
tags: ["source/arxiv","topics/models","topics/ai-safety","topics/evaluation"]
---

Brazilian Portuguese remains underserved by open-source language models, and the few that are safety-aligned rarely document what did not work or validate comparisons with statistical significance. The paper presents Manacá-1B-Instruct-2, the second-generation post-training alignment of Manacá-1B &#40;1.72B parameters, trained from scratch for PT-BR&#41;, with an SFT corpus of 291,223 examples.

The work documents three DPO attempts, all negative, including a case where the training reward margin reaches 1.0 while free generation does not change at all. Safety instead came from a dedicated safety-SFT &#40;in the LLM-jp AnswerCarefully style&#41;, refined over three iterations until the safety-helpfulness frontier closed. A controlled scan of the fraction of general data in the safety-SFT mix &#40;10% to 60%&#41; reveals a non-monotonic over-refusal curve with a knee point at 40-50%.

The final model is compared against four external PT-BR models on the same items, using Wilson confidence intervals and paired McNemar tests with Holm-Bonferroni correction; the lower bound of its safety interval &#40;94.1%&#41; lies above the upper bound of all four baselines.

The paper also reports a methodological finding for LLM-judge evaluation: on two of six safety items in MT-Bench-PT, the judge categorically refuses to assign a score regardless of the response being evaluated, silently reducing the effective N of that category in every prior report of the project. An n-gram decontamination check and a Chinchilla-anchored compute-budget table round out the analysis, attributing the general-capability gap to pre-training scale rather than alignment methodology. All code, raw data, logs and scripts producing every reported number are publicly released.
