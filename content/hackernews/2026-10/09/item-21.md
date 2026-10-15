---
publish: true
content_type: "post"
title: "Serverless Horrors: $10,811.41"
description: "A developer reports being billed US$10,811.41 by Cloudflare after a single Durable Object alarm entered an infinite loop in one project. According to the post, the loop kept rescheduling itself and generated roughly 6 trillion reads and ..."
date: "2026-10-08T18:12:49.000Z"
updated: "2026-10-10T06:19:28.614Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://serverlesshorrors.com/all/cloudflare-108k/"
discussion_url: "https://news.ycombinator.com/item?id=50009654"
tags: ["source/hackernews","topics/inference","topics/security-privacy","topics/industry"]
---

## Article

A developer reports being billed US&#36;10,811.41 by Cloudflare after a single Durable Object alarm entered an infinite loop in one project. According to the post, the loop kept rescheduling itself and generated roughly 6 trillion reads and writes before the invoice arrived.

The author attributes the bug to "vibe coding" and says the bill was paid in full rather than refunded. The support ticket seeking a reduction only produced bot replies in a loop, and staff reached on X and other channels said they could only "take a look." The author says all projects will move off Cloudflare to a self-hosted VPS.

The stated structural issue is that Cloudflare offers no hard spending limit for the account, so nothing capped or stopped the runaway usage. The post frames this as an expensive lesson about delegating cloud resource configuration and monitoring to code the developer does not fully audit.

## HN discussion

Based on 8 selected comments and replies.

Commenters largely agree that providers should offer hard spending caps, preferably on by default for individual accounts. One proposes escalations and firebreaks at spending thresholds such as &#36;10, &#36;50, &#36;100 and &#36;500, with auto-stop if the user does not respond, all optionally disabled. Another rejects provider claims that caps are too hard or that virality makes them unsafe, arguing ordinary metrics monitoring and a balance top-up solve that. One commenter says there should be laws against selling cloud services without a fee cap; a reply argues the market could and should fix this instead. On practice: one keeps personal work on &#36;6–&#36;12 VMs so mistakes can only cost that much, calling free tiers a trap, and another reports the same Durable Object retriggering bug, caught by Claude within minutes from log tailing.

Selected comments: [joshstrange](https://news.ycombinator.com/item?id=50010355) · [traceroute66](https://news.ycombinator.com/item?id=50010571) · [moritzwarhier](https://news.ycombinator.com/item?id=50010580) · [mjd](https://news.ycombinator.com/item?id=50010913) · [SwellJoe](https://news.ycombinator.com/item?id=50011353) · [zmj](https://news.ycombinator.com/item?id=50012056)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50009654>)
