---
publish: true
content_type: "post"
title: "Show HN: Flipflop, Iroh-powered persistent tunnels for filesharing"
description: "This is a project that spun from my frustrations of using LocalSend and DashBeam to transfer stuff between devices, and with the extra goal of…"
date: "2026-10-15T04:25:28.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://github.com/andunieee/flipflop"
discussion_url: "https://news.ycombinator.com/item?id=50099136"
tags: ["source/hackernews","topics/open-source","topics/communication","topics/security-privacy"]
---

## Original excerpt

> This is a project that spun from my frustrations of using LocalSend and DashBeam to transfer stuff between devices, and with the extra goal of…

## HN discussion

Based on 10 selected comments and replies.

Commenters situate Flipflop as a step toward a decentralized internet, with pairing as the core mechanism that links your own devices together. One thread &#40;50100025&#41; notes that the project leans on the Iroh library for NAT and firewall hole punching, external address discovery and overlay networking, and observes that connecting two 5G devices without a coordinating central server is possible but very hard.

An Iroh maintainer &#40;50100678&#41; replies that they do not yet implement birthday-paradox hole punching and that there is internal debate over whether it is worth it, so unusual NATs fall back to a relay: public relays, rented relays, or a self-hosted one. They argue a P2P social app that occasionally uses a relay is still preferable to a centralized app, since the relay merely forwards end-to-end encrypted connections and cannot learn the content.

Comparison and feature requests follow. Asked how it differs from Tailscale's Taildrop &#40;50102454 reply&#41;, the author says Taildrop suits people already on Tailscale, which relies on a central server and an owner, whereas Flipflop needs nothing beyond the app and each peer pair forms its own ownerless, unmanaged network. A commenter &#40;50100262&#41; praises the browser link for sharing with devices that lack Flipflop on the same LAN and calls internet support a killer feature were it possible; the author &#40;50102410&#41; calls that a good idea, says it had not occurred to him, and plans to implement it, noting Iroh reportedly works in the browser by always using a relay. Another commenter &#40;50099862&#41; highlights that keeping the tunnel alive between sends is the nice part, so once set up it is simply usable.

Selected comments: [synctext](https://news.ycombinator.com/item?id=50100025) · [rklaehn](https://news.ycombinator.com/item?id=50100678) · [andunie](https://news.ycombinator.com/item?id=50102454) · [YCombinedBob](https://news.ycombinator.com/item?id=50100262) · [andunie](https://news.ycombinator.com/item?id=50102410) · [cold&#95;boot](https://news.ycombinator.com/item?id=50099862)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50099136>)
