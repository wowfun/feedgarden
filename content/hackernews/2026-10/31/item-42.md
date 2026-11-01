---
publish: true
content_type: "post"
title: "Jepsen: ParticleDB 1.1.4"
description: "Jepsen tested ParticleDB, a Rust multi-model database built by Orkes for AI workloads and workflow orchestration, across versions 1.1.4 through 1.1.18.11.rc-22. It found the product's “Full ACID” claims premature, documenting 96 issues r..."
date: "2026-10-31T13:39:52.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://jepsen.io/analyses/particledb-1.1.4"
discussion_url: "https://news.ycombinator.com/item?id=50316100"
tags: ["source/hackernews","topics/databases","topics/evaluation"]
---

## Article

Jepsen tested ParticleDB, a Rust multi-model database built by Orkes for AI workloads and workflow orchestration, across versions 1.1.4 through 1.1.18.11.rc-22. It found the product's “Full ACID” claims premature, documenting 96 issues ranging from crashes, deadlocks and data loss to partially invisible rows, dropped tables reappearing in distorted forms, confused columns and type confusion. Most issues reproduced on a single server with a single client and no faults introduced. By version 1.1.18.11.rc-22, all but ten of those issues appeared resolved. Yet two serious problems remained: committed writes were still lost during normal operation under the default optimistic-concurrency transaction mode, and even the strongest serializable isolation still permitted internal anomalies and lost updates. Orkes subsequently released 1.1.19-rc.13 and claims it resolves all remaining issues discussed in the report. ParticleDB aims to unify transactional SQL, key-value storage, vector search, live analytics and user-defined Particles behind Postgres, Redis, gRPC and HTTP interfaces, claiming orders-of-magnitude speed over Postgres. It evolved from a limited 1.0.0 built for Orkes's Conductor platform, then was refactored for broader release; because replication was available only in enterprise cloud deployments, Jepsen tested single-node builds only. Safety claims were also inconsistent: a promised TLA+ formal proof was unavailable during collaboration, and documentation disagreed over whether the groupsync write-ahead-log mode offered weaker or equal durability compared with fsync. Jepsen recommends halting further deployment, migrating to other databases as soon as possible, and checking or rebuilding database state from more reliable sources where available. The research was funded by Orkes and conducted under the Jepsen ethics policy.

## HN discussion

Based on 10 selected comments and replies.

Commenters echoed the report's severity: the&#95;duke quoted findings of frequent, profound transactional anomalies, including lost committed writes and cyclic anomalies in the append workload. amluto argued ParticleDB appears “incorrect by construction,” with safety depending on luck and workarounds rather than a sound overall design. wofo and Voultapher tied the defects to “vibecoding” and AI-assisted development, while semiquaver countered that moving abstraction layers upward is a nontrivial process in which LLMs can produce plausible but poor code. edude03 noted that 96 issues exceeds the typical database report and questioned whether a stable release should contain so many. tensegrist highlighted the missing TLA+ specification behind “formally proven” claims. Betelbuddy mocked investors' due diligence. The sample shows strong criticism but no independent verification or Orkes response.

Selected comments: [the&#95;duke](https://news.ycombinator.com/item?id=50318160) · [amluto](https://news.ycombinator.com/item?id=50319470) · [wofo](https://news.ycombinator.com/item?id=50319040) · [Voultapher](https://news.ycombinator.com/item?id=50325323) · [edude03](https://news.ycombinator.com/item?id=50317862) · [tensegrist](https://news.ycombinator.com/item?id=50318544)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50316100>)
