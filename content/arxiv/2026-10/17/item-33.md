---
publish: true
content_type: "post"
title: "Refining a casting-domain ontology with embeddings plus LLM repair suggestions"
description: "Ontologies organize complex knowledge in domains such as biomedicine and healthcare, but building reliable ones is hard: class hierarchies, whether constructed manually or automatically, can contain subtle subsumption errors that need ca..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21466"
tags: ["source/arxiv","topics/ontologies","topics/research"]
---

Ontologies organize complex knowledge in domains such as biomedicine and healthcare, but building reliable ones is hard: class hierarchies, whether constructed manually or automatically, can contain subtle subsumption errors that need careful refinement. The authors study this problem in CASTON, a casting-domain ontology, and present a refinement workflow that is deliberately lightweight yet scalable.

A fine-tuned ontology embedding model first extracts a limited number of candidate axioms for refinement together with possible replacement candidates; an LLM then returns repair suggestions for those candidates. This splits the work between embedding-based candidate selection, which narrows the search space, and language-model judgment, which proposes the actual repairs.

In a small expert evaluation, the default configuration, combining a CASTON-fine-tuned OnT embedding model with Qwen3-8B, produced reliable high-confidence repairs: all six high-confidence replacements were accepted by both domain experts. The abstract does not report how many candidates were reviewed in total, how lower-confidence suggestions fared, or how the workflow scales beyond this single case study, so the evidence rests on a limited expert sample even though the result is encouraging. The implementation is available in the OntRefine repository. The approach is notable for keeping human experts in the loop while using embeddings to make LLM review tractable in specialized domains.
