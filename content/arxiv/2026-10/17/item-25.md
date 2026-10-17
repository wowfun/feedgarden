---
publish: true
content_type: "post"
title: "FedSkillGit: Federated Skill Evolution via Version Control"
description: "Large language model agents can improve by evolving reusable natural-language skills from execution experience. In real deployments that experience is spread across data owners who cannot pool raw data, which motivates federated skill ev..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21348"
tags: ["source/arxiv","topics/agents","topics/security-privacy"]
---

Large language model agents can improve by evolving reusable natural-language skills from execution experience. In real deployments that experience is spread across data owners who cannot pool raw data, which motivates federated skill evolution. The obvious first design has each client evolve the whole skill document and upload it for server-side aggregation, but the authors argue this fits skill evolution poorly for three reasons: an evolved document can still carry client-specific content distilled from private traces; repeatedly transmitting a nearly unchanged document spends communication on knowledge the population already holds; and a single client's contribution is buried in a document the server cannot meaningfully attribute.

FedSkillGit replaces full-document updates with commits. Each client submits a bounded set of patches over named rules together with its local experience, a summary of what the round taught it, and the pair passes a two-stage privacy filter before leaving the client. The server deduplicates the submitted patches and the local experience of all participants, updates a global experience document that only the optimizers read, and merges the surviving patches into a candidate skill.

The candidate is then distributed to the clients, which score it on their own validation sets and report the results; it is published only when those reported scores improve on the current version. Experiments on three datasets and three language model families show FedSkillGit outperforms state-of-the-art baselines by up to 22% and approaches centralized evolution without sharing raw client data.
