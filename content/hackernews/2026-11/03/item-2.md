---
publish: true
content_type: "post"
title: "Moving our warehouse off DuckDB"
description: "PostHog describes why it is moving its customer-facing data warehouse product off DuckDB only five months after rebuilding it on DuckDB instead of ClickHouse. The earlier switch gave each customer a private DuckDB instance and let tools ..."
date: "2026-11-02T16:02:26.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50338747"
source_url: "https://posthog.com/blog/moving-off-duckdb"
discussion_url: "https://news.ycombinator.com/item?id=50338747"
tags: ["source/hackernews","topics/databases","topics/cloud-computing"]
---

## Article

PostHog describes why it is moving its customer-facing data warehouse product off DuckDB only five months after rebuilding it on DuckDB instead of ClickHouse. The earlier switch gave each customer a private DuckDB instance and let tools such as dbt connect over Postgres, but the company underestimated how large and complex customer workloads would become. It now wants a warehouse that works at any scale at a fair price, and has spent three months re-architecting without DuckDB. The post praises DuckDB as perhaps the best single-node analytics tool, noting its robustness and ability to spill to disk when memory runs out, but argues those strengths become liabilities in the cloud. A single-node engine must be sized before a query arrives, and predicting CPU and memory for a specific query is hard; users should not have to manage resources. Other bottlenecks included fetching large volumes from S3 without async fetching, which DuckDB added only recently, and the DuckLake lakehouse extension. DuckLake was installed by default to make DuckDB a fully fledged warehouse. It worked up to a point, but at PostHog's scale its portable catalog schema limited engine-specific optimizations: a single-table write could take more than three minutes because each commit re-read statistics for the entire catalog. Over 99% of catalog statistics rows belonged to deleted tables; cleaning them sped writes 30 to 50 times, but rows regrew. Connection counts to metadata databases also hurt on shared Postgres. The deployment held about 2 PB, roughly 1 trillion rows and 15.3 million snapshots, and broke in ways hard to fix within DuckLake's scope; the team carried patches in a fork, losing community benefits. The post also says offering direct Postgres connections over port 5432 proved harder to scale than HTTP, citing missing reconnects and the difficulty of managing TTLs and idle connections at scale, plus scarce tooling for load balancing pgwire.

## HN discussion

Based on 10 selected comments and replies.

Commenters questioned the migration churn: Aurornis noted PostHog moved from ClickHouse to DuckDB five months ago and now appears to be switching again, wishing the post had shown pre-migration testing and whether the new setup worked. 0c3ca83 felt the post lacked technical detail and measurements. Deukhoofd worried the 'rewrote twice' message would unsettle product users. bitpush questioned publishing before results settled and linked to the earlier victory-lap post. hasyimibhar suggested returning to ClickHouse given its improved Iceberg support. Author roboben clarified the post concerns the customer-facing product, while PostHog's internal warehouse still runs on ClickHouse.

Selected comments: [Aurornis](https://news.ycombinator.com/item?id=50339465) · [0c3ca83](https://news.ycombinator.com/item?id=50339238) · [Deukhoofd](https://news.ycombinator.com/item?id=50340905) · [bitpush](https://news.ycombinator.com/item?id=50339412) · [hasyimibhar](https://news.ycombinator.com/item?id=50339977) · [roboben](https://news.ycombinator.com/item?id=50341880)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50338747>)
