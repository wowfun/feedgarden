---
publish: true
content_type: "post"
title: "Meadows – a small language for stock-and-flow diagrams that run"
description: "The submitter, jjsalamon, describes building a small language for Donella Meadows-style stock-and-flow diagrams while reading \"Thinking in Systems\" and wanting to manipulate its diagrams rather than just look at them. You type a model such "
date: "2026-10-09T12:29:40.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://lorezzed.github.io/meadows/"
discussion_url: "https://news.ycombinator.com/item?id=50019535"
tags: ["source/hackernews","topics/coding","topics/system-dynamics"]
---

## HN discussion

Based on 3 selected comments and replies.

The submitter, jjsalamon, describes building a small language for Donella Meadows-style stock-and-flow diagrams while reading "Thinking in Systems" and wanting to manipulate its diagrams rather than just look at them. You type a model such as &#124;&gt;inflow &#91;water in tub: 50&#93; =&gt;outflow: 5&#124; and get the stock-and-flow diagram, a chart of each stock over time, and an animation of the run on the diagram itself, with stocks and feedback loops pulsing. Each example carries notes in its source, diagrams can also be built by clicking, and it runs entirely in the browser with no account or backend; the whole model lives in the URL, so any diagram can be shared.

Commenter jamessb reports that the behaviour-over-time graphs do not render for the hunger, chicken-and-egg, burnout and predator-and-prey examples. The author replies that those early examples have no units attached, so in effect there is nothing to plot, though the system still renders; later examples add numbers to stock and flow nodes, which populates both graphs. He suggests this could be made clearer to users.

Selected comments: [jjsalamon](https://news.ycombinator.com/item?id=50019536) · [jamessb](https://news.ycombinator.com/item?id=50020655) · [jjsalamon](https://news.ycombinator.com/item?id=50020772)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50019535>)
