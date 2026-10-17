---
publish: true
content_type: "post"
title: "You Could Have Invented Transformers From Memory"
description: "The thread centers on where the article's memory framing breaks down for LLMs. One commenter asked what plays the role of values if the context tokens are the keys; a reply walked through the mechanics, noting that queries, keys and valu..."
date: "2026-10-16T19:01:17.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://alexwang.ai/posts/associative-memory/"
discussion_url: "https://news.ycombinator.com/item?id=50122878"
tags: ["source/hackernews","topics/models","topics/research"]
---

## HN discussion

Based on 10 selected comments and replies.

The thread centers on where the article's memory framing breaks down for LLMs. One commenter asked what plays the role of values if the context tokens are the keys; a reply walked through the mechanics, noting that queries, keys and values are all computed at inference time by multiplying token representations with learned weight matrices &#40;Q = XW&#95;q, K = XW&#95;k, V = XW&#95;v&#41;, so K and V function like a dictionary's keys and values while Q is the lookup.

Another commenter highlighted a favorite fact: viewed as a Hopfield network, a transformer needs only a single step to retrieve a suitable stored pattern, where a vanilla Hopfield network requires several iterative steps.

Others followed the article's suggestion that intelligence resembles compression, with one pointing to a 3Blue1Brown video series on that theme and saying the post made the connection more interesting for them. A reader joked that such articles should first define what qualifies as the "you" in the title, and a reply dismissed the quibble as pedantry over a common rhetorical form.

Selected comments: [dullcrisp](https://news.ycombinator.com/item?id=50126359) · [wilkystyle](https://news.ycombinator.com/item?id=50126542) · [vatsachak](https://news.ycombinator.com/item?id=50125884) · [sailfast](https://news.ycombinator.com/item?id=50125167) · [yhjc2692](https://news.ycombinator.com/item?id=50126978) · [yoz-y](https://news.ycombinator.com/item?id=50125731)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50122878>)
