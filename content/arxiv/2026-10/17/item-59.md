---
publish: true
content_type: "post"
title: "RAG-RST Supplies RST Discourse Schemas as Retrieved In-Context Exemplars"
description: "Rhetorical Structure Theory (RST) parsing labels each edge of a discourse tree with a nuclearity tag and a relation from a closed inventory. Neither label follows directly from surface wording: the same two clauses can be Elaboration or ..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22150"
tags: ["source/arxiv","topics/research","topics/models"]
---

Rhetorical Structure Theory &#40;RST&#41; parsing labels each edge of a discourse tree with a nuclearity tag and a relation from a closed inventory. Neither label follows directly from surface wording: the same two clauses can be Elaboration or Background depending on rhetorical intent, and the boundary is set by annotation convention. The authors report that a strong LLM given only a target elementary discourse unit pair reaches 0.794 F1 on nuclearity and 0.738 F1 on relation, indicating that exposure to discourse-rich pretraining text does not supply a usable schema.

RAG-RST addresses this by retrieving demonstrations at inference time rather than updating model parameters. In the precomputed configuration, all EDU pairs are labeled before parsing; in the dynamic configuration, retrieval happens at each reduce step, so the exemplars depend on reductions the parser has already committed to. The method raises nuclearity to 0.846 F1 and relation to 0.788 F1 with no training, and both configurations beat existing RST parsers on span, nuclearity, relation and full-tree metrics. The dynamic variant is consistently strongest.

Two properties of the retrieved schema are reported. Its benefit is bounded in number, saturating and then declining beyond fifty exemplars, and it depends on structural position. The authors conclude that a formal linguistic schema can be supplied to a foundation model as a demonstration instead of being trained into its parameters.
