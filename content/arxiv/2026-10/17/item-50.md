---
publish: true
content_type: "post"
title: "CARA: Causally Guided Retrieval Agent for Question Answering"
description: "Retrieval-augmented generation over text-rich knowledge graphs requires finding evidence that actually contributes to answering a question, not merely evidence that matches its wording. Existing agentic retrievers adaptively balance glob..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22017"
tags: ["source/arxiv","topics/agents","topics/ontologies"]
---

Retrieval-augmented generation over text-rich knowledge graphs requires finding evidence that actually contributes to answering a question, not merely evidence that matches its wording. Existing agentic retrievers adaptively balance global search and multi-hop exploration, but they rely mainly on textual similarity to guide retrieval.

CARA is a training-free, causally guided retrieval agent that evaluates the causal relevance of retrieved evidence through two criteria: consequentiality, whether adding the evidence improves answerability, and essentiality, whether removing it weakens answerability. CARA combines these assessments with path consistency to guide graph exploration and uses reciprocal rank fusion to aggregate evidence from multiple agents.

The authors evaluate CARA on three STaRK datasets, augmenting STaRK with ground-truth answers to enable downstream question-answering evaluation. They report that CARA consistently outperforms existing retrievers, improves answer quality and faithfulness, and examines fewer graph nodes while requiring fewer retrieval operations. They conclude that causal relevance assessment enables more focused and effective agentic graph retrieval.
