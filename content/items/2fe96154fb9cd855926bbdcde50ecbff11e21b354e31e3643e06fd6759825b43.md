---
publish: true
content_type: "post"
title: "Production Grade Retrieval Pipeline That Admits \"I Don't Know\" [P]"
description: "A post on r/MachineLearning shares a checklist for teams moving a retrieval-augmented generation (RAG) prototype into production, presented as the list the author wished they had when they made the move. A linked video is offered as a walkt"
date: "2026-10-08T17:55:50.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x0xt5x/production_grade_retrieval_pipeline_that_admits_i/"
tags: ["source/reddit","topics/coding","topics/products","topics/security-privacy"]
---

A post on r/MachineLearning shares a checklist for teams moving a retrieval-augmented generation &#40;RAG&#41; prototype into production, presented as the list the author wished they had when they made the move. A linked video is offered as a walkthrough of the same material.

The checklist has four items:

- Citations attached to every answer
- Refusing to answer when the retrieved context does not support one
- Access control that cannot be bypassed
- Ingestion that never blocks a user

The post gives no architecture details, measurements, tooling names or evidence about how these requirements were validated, so the list is best read as a set of properties to test a pipeline against rather than a proven design.

## Images and video

- [Video: https&#58;//youtu.be/-GK1e4KZqhw](<https://youtu.be/-GK1e4KZqhw>)
