---
publish: true
content_type: "post"
title: "Better HTTP/1 connection reuse in Go 1.27"
description: "Commenters focus on connection handling and the standard library's direction. giancarlostoro welcomes the change and asks when HTTP/3 will reach the stdlib, praising Go's out-of-the-box HTTP support as central to its adoption; brainzap r..."
date: "2026-10-14T16:29:33.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://go.dev/blog/http-connection-reuse"
discussion_url: "https://news.ycombinator.com/item?id=50090369"
tags: ["source/hackernews","topics/coding","topics/inference","topics/open-source"]
---

## HN discussion

Based on 10 selected comments and replies.

Commenters focus on connection handling and the standard library's direction. giancarlostoro welcomes the change and asks when HTTP/3 will reach the stdlib, praising Go's out-of-the-box HTTP support as central to its adoption; brainzap replies that a net/http cleanup is reportedly under way to prepare for it.

jerf notes the behavior is surprising and seemingly undocumented on net/http itself, calling it a frequent client-side question, and asks how to force a connection closed without draining a socket that will not be reused. jchw counters that Close is arguably too high-level for such documentation, since on HTTP/2 the request lifecycle is untethered from any socket; forcing the underlying connection shut is more logical if immediate closure is wanted. gandreani jokes that the Go team may have committed to automatic reuse only after encountering successively uglier drainAndCloseBody variants in the wild, third of which involved an HTTP/2 connection.

On pitfalls, rkuska warns that using json.Decoder can still forfeit reuse: the decoder reads only part of the body, and a trailing newline can be left unread. hxtk responds that the Decoder is not recommended for that case because of readers without a single suffixed JSON document, and points to UnmarshalRead in encoding/json/v2 as the intended tool. jamesponddotco and aleksi say they can finally retire their own drain helpers.

Selected comments: [giancarlostoro](https://news.ycombinator.com/item?id=50094920) · [jerf](https://news.ycombinator.com/item?id=50092129) · [jchw](https://news.ycombinator.com/item?id=50092359) · [gandreani](https://news.ycombinator.com/item?id=50093313) · [rkuska](https://news.ycombinator.com/item?id=50092268) · [hxtk](https://news.ycombinator.com/item?id=50095547)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50090369>)
