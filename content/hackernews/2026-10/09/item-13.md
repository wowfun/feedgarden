---
publish: true
content_type: "post"
title: "Scaling and benchmarking a critical message bus using a new indexing strategy"
description: "This post is part of a series about 2026 summer intern projects at Jane Street. Aria, the firm's internal messaging framework and hosted system, processes multiple terabytes of data per day and lets clients subscribe to a live stream of mes"
date: "2026-10-08T17:39:26.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://blog.janestreet.com/scaling-and-benchmarking-a-critical-message-bus/"
discussion_url: "https://news.ycombinator.com/item?id=50009066"
tags: ["source/hackernews","topics/coding","topics/research"]
---

## Article

This post is part of a series about 2026 summer intern projects at Jane Street. Aria, the firm's internal messaging framework and hosted system, processes multiple terabytes of data per day and lets clients subscribe to a live stream of messages. As usage grew, the team sought ways to re-architect for higher volume and throughput. Intern Theodor Totev focused on making it cheaper for clients to read only a subset of messages, and his optimizations produced a 30% decrease in CPU usage on production workloads while maintaining the high correctness bar the system requires.

The problem arose in tip recovery. Aria keeps the recent stream, called the stream tip, in an in-memory ring buffer so a client that falls behind can request recent messages and catch up. But Aria stores the entire stream, while clients often care about a much smaller subset. The message stream is divided into topics forming a hierarchical namespace like a file system, and clients subscribe either to one topic or to a topic subtree, similar to a globstar. Aria originally filtered the whole stream with a simple linear pass; although algorithmically inefficient, linear looping is CPU-cache friendly and reasonably fast. As more clients performed tip recovery, some servers hit 100% CPU utilization and clients fell off the tip without being able to catch up. Adding servers was a temporary fix, so the recovery code was rewritten.

The solution was index data structures for filtering. Because an Aria instance can have close to a million topics, an index per topic was untenable. Instead, an index is created for each topic partition, defined as all topics sharing the same two-segment prefix, where a segment is one slash-separated part of a topic name, so app/codestore/commits and app/codestore/features fall under the app/codestore partition. Each partition's index records where its messages sit in the Aria stream, and when a client requests messages Aria performs an n-way merge of the indexes using a min-heap to reconstruct the stream in order for just those partitions. Benchmarking came first: an intern-written tool profiled various recovery scenarios, varying the number of topic partitions, the degree of interleaving and the number of readers. Profiling the initial implementation showed the min-heap was the biggest bottleneck, and the account continues from there.

## HN discussion

Based on 4 selected comments and replies.

Commenters largely approved of the approach while adding caveats. One noted the irony that financial-firm interviews often involve min-heap problems, so this team was unusually well primed for the task. Another endorsed partitioning by prefix and pooling 1024-entry blocks to avoid roughly 2 GB of worst-case index bloat. A reply agreed linear scans break at scale but argued the trade-off varies: when a linear scan provably cannot be beaten and its accuracy helps the business, a dead-simple, CPU-friendly algorithm may be the better choice. A fourth commenter cautioned that buses resemble single points of failure; publishing everything to the bus may be fine, but the number of subscribers should be minimized.

Selected comments: [rtpg](https://news.ycombinator.com/item?id=50016325) · [soltanov](https://news.ycombinator.com/item?id=50016064) · [hansvm](https://news.ycombinator.com/item?id=50016269) · [jgalt212](https://news.ycombinator.com/item?id=50019616)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50009066>)

## Images and video

- [Image](<https://blog.janestreet.com/scaling-and-benchmarking-a-critical-message-bus/image2.png>)
- [Image](<https://blog.janestreet.com/scaling-and-benchmarking-a-critical-message-bus/image6.png>)
