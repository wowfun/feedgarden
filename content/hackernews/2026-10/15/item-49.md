---
publish: true
content_type: "post"
title: "Virtual Oxide Labs: Emulating a Full Oxide Rack"
description: "Commenters focus on how such a rack-scale setup could reach developers. One quotes Oxide's own description of \"racklettes\": real but smaller-than-average racks of four sleds and two switches that can be initialized and run exactly like a..."
date: "2026-10-14T18:21:14.000Z"
updated: "2026-10-15T15:41:45.488Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://oxide.computer/blog/voxel-labs"
discussion_url: "https://news.ycombinator.com/item?id=50092423"
tags: ["source/hackernews","topics/hardware","topics/open-source","topics/evaluation"]
---

## HN discussion

Based on 9 selected comments and replies.

Commenters focus on how such a rack-scale setup could reach developers. One quotes Oxide's own description of "racklettes": real but smaller-than-average racks of four sleds and two switches that can be initialized and run exactly like a full rack, while noting they are not sold in any economical form factor.

A reply explains the commercial obstacle: because the racklettes are development tools, their networking stack is still scaled for a full rack with powerful switches, so Oxide would either have to maintain a second network stack with its own firmware or charge a price few would pay.

Others describe their own experiments. One builder published an open-source CLI and blog posts for emulating the virtualization stack; another booted Helios and Omicron on bare metal in a homelab, finding performance weak on 32-core dual-Xeon hardware with 256 GB DDR4 and roughly 30% idle CPU use, which prompted a question about polling. A veteran of similar projects says simulating upgrades as part of automated CI was among the most valuable testing work, catching regressions and verifying new functionality faster.

Selected comments: [qchris](https://news.ycombinator.com/item?id=50097387) · [duttish](https://news.ycombinator.com/item?id=50100024) · [swherdman](https://news.ycombinator.com/item?id=50095602) · [pbnjay](https://news.ycombinator.com/item?id=50097923) · [happyPersonR](https://news.ycombinator.com/item?id=50098580)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50092423>)
