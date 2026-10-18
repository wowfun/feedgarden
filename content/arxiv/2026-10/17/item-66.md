---
publish: true
content_type: "post"
title: "Private Retrieval Augmented Generation via Random Projection"
description: "Retrieval-augmented generation (RAG) improves large language model capabilities by querying external structured knowledge, but it can also leak sensitive information from the retrieval datastore. The authors propose a simple method to pr..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.22297"
tags: ["source/arxiv","topics/security-privacy","topics/research","topics/evaluation"]
---

Retrieval-augmented generation &#40;RAG&#41; improves large language model capabilities by querying external structured knowledge, but it can also leak sensitive information from the retrieval datastore. The authors propose a simple method to protect datastore privacy using random projection.

The same projection is applied to both the datastore embeddings and the query embeddings. Because queries and stored items undergo an identical transformation, the authors say the approach provably preserves the semantic similarity between queries and retrieved items while substantially mitigating data extraction attacks. Experiments cover multiple RAG architectures and datasets: compared with prior methods that rely on formal differential privacy &#40;DP&#41; guarantees, the lightweight approach achieves better retrieval and generation performance, while showing comparable empirical privacy under strong attack models.

The authors describe these as the first results suggesting that random projection can serve as a competitive and practical baseline for privacy-preserving RAG systems. A key qualification is that privacy is assessed empirically rather than through a formal DP guarantee; the abstract does not give the projection dimensionality, attack setup details or absolute leakage rates.
