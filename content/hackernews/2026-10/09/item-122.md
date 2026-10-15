---
publish: true
content_type: "post"
title: "The Hetzner Cloud network stack – history and technical overview"
description: "Commenters largely read the piece as a technical history, with one noting the architecture resembles BGP EVPN over VXLAN, except the VTEPs run on the hypervisors rather than the top-of-rack switches, as in OpenStack. Another recalls impl..."
date: "2026-10-09T12:20:55.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://www.hetzner.com/blog/the-hetzner-cloud-network-stack-history-and-technical-overview/"
discussion_url: "https://news.ycombinator.com/item?id=50019451"
tags: ["source/hackernews","topics/inference","topics/hardware","topics/communication"]
---

## HN discussion

Based on 8 selected comments and replies.

Commenters largely read the piece as a technical history, with one noting the architecture resembles BGP EVPN over VXLAN, except the VTEPs run on the hypervisors rather than the top-of-rack switches, as in OpenStack. Another recalls implementing Open vSwitch around 2014, describing the reverse-engineering work needed to derive requirements for stateful middleware.

A parallel thread covers storage-box throughput. One user on a 1000/400 fibre link reports only about 3 MB/s, making the allotted 10 TB unusable; a reply attributes this to ISP rate limiting on Hetzner's public storage-box interface rather than Hetzner, suggesting Hetzner servers get a faster direct link, and that a home VPN or concurrent WebDAV over HTTPS can raise throughput. Other commenters report cheaper, beefier VMs but also a 13-hour outage, contrasted with 12 years on Digital Ocean. Pricing was disputed, with one reply arguing that customers unhappy with a price should simply choose an alternative. These are individual experiences and opinions, not article findings.

Selected comments: [publlus&#95;enigma](https://news.ycombinator.com/item?id=50021051) · [jerrythegerbil](https://news.ycombinator.com/item?id=50022855) · [throw0101a](https://news.ycombinator.com/item?id=50020706) · [Lucasoato](https://news.ycombinator.com/item?id=50019954) · [segmondy](https://news.ycombinator.com/item?id=50022153) · [tasuki](https://news.ycombinator.com/item?id=50019925)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50019451>)
