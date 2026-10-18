---
publish: true
content_type: "post"
title: "Decomposing Brain-LLM Alignment with Interpretable Semantic Representations"
description: "Large language models predict neural responses during naturalistic language comprehension, but the linguistic information behind that brain alignment is hard to interpret. A study by Camila Kolling and Mariya Toneva uses SCRIBE — an inte..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21508"
tags: ["source/arxiv","topics/research","topics/models"]
---

Large language models predict neural responses during naturalistic language comprehension, but the linguistic information behind that brain alignment is hard to interpret. A study by Camila Kolling and Mariya Toneva uses SCRIBE — an interpretable contextual semantic representation spanning 65 neurocognitively grounded semantic properties — to decompose the alignment of LLaMA2-7B with fMRI data from seven participants listening to Moth Radio Hour stories.

Variance partitioning separates brain-predictive variance shared between the two representations from variance unique to each. Shared variance is the dominant component across the whole brain and in language-related regions, while both representations also retain significant unique contributions. The authors then ask whether the concreteness of individual semantic properties relates to shared and SCRIBE-unique variance. Concrete properties show greater shared variance with LLaMA2-7B than abstract properties across the whole brain and most examined regions, whereas abstract properties do not show greater SCRIBE-unique variance.

Property ablations indicate that semantic contributions extend across multiple dimensions, with cumulative effects on both shared and SCRIBE-unique variance.

The authors conclude that, for LLaMA2-7B on this dataset, a substantial portion of brain-LLM alignment is associated with interpretable semantic information, and that the analysis also reveals complementary brain-predictive semantic information beyond the LLaMA2-7B representation.
