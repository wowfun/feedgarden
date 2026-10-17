---
publish: true
content_type: "post"
title: "Show HN: Petal, open-source CoScreen/ScreenHero finally free"
description: "Jason Thomas, a CoScreen co-founder, introduces Petal, a free and open-source pair programming and screen sharing tool built by four members of the original CoScreen team after Datadog sunset the CoScreen service on July 31. The project ..."
date: "2026-10-14T18:23:14.000Z"
updated: "2026-10-15T15:41:45.488Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://petal.live/"
discussion_url: "https://news.ycombinator.com/item?id=50092470"
tags: ["source/hackernews","topics/open-source","topics/coding","topics/products"]
---

## Article

Jason Thomas, a CoScreen co-founder, introduces Petal, a free and open-source pair programming and screen sharing tool built by four members of the original CoScreen team after Datadog sunset the CoScreen service on July 31. The project is hosted at github.com/kiruna-labs/petal.

Thomas frames it as a reaction to a recurring pattern: Screenhero was bought by Slack in 2015 and its standalone app shut down in December 2017; Around was acquired by Miro and shut down in March 2025; Multi &#40;formerly Remotion&#41; was acqui-hired by OpenAI in 2024 and closed about a month later. The team says Petal will not be monetized, and that users can self-host or fork it if the maintainers lose interest.

Functionally, shared windows appear as real, movable and resizable windows on the desktop rather than tiles. Several people can share at once, each participant gets a labeled cursor, and anyone can click into a shared window to type and scroll. Rooms are persistent, so users join a named room such as "eng-sync" instead of exchanging links. Petal runs on macOS and Windows, with Linux stated as next &#40;open to contributions&#41;, plus a web app. Media is carried over LiveKit; users can rely on the hosted instance or point the app at their own LiveKit server via a single docker-compose, or even a different video backend.

The team notes that CoScreen took almost six years to build, while the first version of Petal took under eight weeks, with frontier models doing much of the work on unforgiving real-time video and window capture code. They promise a writeup of what worked and what did not.

## HN discussion

Based on 10 selected comments and replies.

The Screenhero co-founder and CEO responds that he had similar feelings after his own product was sunset, and now works on Pop, whose 2020 launch he describes as essentially Screenhero 2.0 and which has since expanded into a virtual office for remote teams; Pop has Wayland support, part of which they plan to open source and which Petal might use. Another commenter asks how that virtual office compares with Gather, which goes unanswered in this sample.

CoScreen co-founder Till thanks HN for early feedback that mattered back in 2019, and says unfulfilled plans such as Linux support are now being realized. Others compare Petal with adjacent tools: one notes the resemblance to Tuple, also billed as a Screenhero replacement, and a reply agrees it is another great app in the space. A commenter enthusiastic about pair programming laments that even JetBrains is retiring its Code With Me service, calling such tools a way to strengthen human connection. A small startup participant sees a fit for remote joint debugging and walking customers through tricky issues.

Selected comments: [jsherwani](https://news.ycombinator.com/item?id=50094088) · [claydiffrient](https://news.ycombinator.com/item?id=50098499) · [coscreen](https://news.ycombinator.com/item?id=50092660) · [joshuat](https://news.ycombinator.com/item?id=50095294) · [lochnessduck](https://news.ycombinator.com/item?id=50095983) · [citizenfishy](https://news.ycombinator.com/item?id=50094634)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50092470>)
