---
publish: true
content_type: "post"
title: "Ubuntu still has not released patch for Linux 0day RCE in almost 3 weeks"
description: "Ubuntu has not shipped patched kernels for CVE-2026-98432, a critical vulnerability rated CVSS 9.8, leaving the 22.04, 24.04, and 26.04 LTS releases without a vendor update nearly three weeks after disclosure. Operators on those releases..."
date: "2026-11-02T18:39:38.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50341462"
source_url: "https://freenode.net/article/ubuntu-lts-kernels-still-unfixed-for-critical-cve-2026-98432"
discussion_url: "https://news.ycombinator.com/item?id=50341462"
tags: ["source/hackernews","topics/linux","topics/security-privacy"]
---

## Article

Ubuntu has not shipped patched kernels for CVE-2026-98432, a critical vulnerability rated CVSS 9.8, leaving the 22.04, 24.04, and 26.04 LTS releases without a vendor update nearly three weeks after disclosure. Operators on those releases have no official kernel package that closes the hole. The exposure is most acute for internet-facing and multi-tenant self-hosted systems that depend on Ubuntu's LTS kernels for isolation and privilege boundaries; those hosts remain vulnerable to whatever remote or local attack the CVE enables until packages appear. Ubuntu has not announced an ETA for fixes. In the interim, administrators must choose between staying on the stock kernel, applying out-of-tree mitigations if available, or migrating workloads to releases or kernels that already carry the patch.

## HN discussion

Based on 10 selected comments and replies.

Commenters debate whether Ubuntu's delay is acceptable and what users can do meanwhile. debinguy proposes an iptables/nftables U32 drop rule in raw PREROUTING as a stopgap, while lambdaone replies that Linux admins can self-mitigate but a distribution's purpose is to remove that burden. lambdaone &#40;50350034&#41; argues the failure alone is enough to write Ubuntu off, since volunteer-run distros patch faster than a well-resourced company. c0l0 asks for an official explanation of the delay, and wolvoleo speculates Ubuntu is waiting for a patch window, with organizational governance slowing the response. majorchord notes RHEL documents a mitigation that only reduces exposure, while Ubuntu offers none. The sample shows disagreement over vendor accountability, with some users considering switching to Debian, and no consensus on whether self-applied workarounds are an adequate substitute for vendor patches.

Selected comments: [debinguy](https://news.ycombinator.com/item?id=50346903) · [lambdaone](https://news.ycombinator.com/item?id=50350053) · [lambdaone](https://news.ycombinator.com/item?id=50350034) · [c0l0](https://news.ycombinator.com/item?id=50343405) · [wolvoleo](https://news.ycombinator.com/item?id=50347675) · [majorchord](https://news.ycombinator.com/item?id=50341463)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50341462>)
