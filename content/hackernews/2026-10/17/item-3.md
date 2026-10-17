---
publish: true
content_type: "post"
title: "JPEG XL vs. AVIF for web use-cases"
description: "Commenters debate encoder maturity as much as format design. One notes that libjxl's maximum-effort settings are very slow: files come out only 2–7% smaller for photos and about 25% smaller for a screenshot and an illustration, yet encod..."
date: "2026-10-16T16:12:02.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://jakearchibald.com/2026/jpeg-xl-vs-avif/"
discussion_url: "https://news.ycombinator.com/item?id=50120224"
tags: ["source/hackernews","topics/image-compression","topics/open-source"]
---

## HN discussion

Based on 10 selected comments and replies.

Commenters debate encoder maturity as much as format design. One notes that libjxl's maximum-effort settings are very slow: files come out only 2–7% smaller for photos and about 25% smaller for a screenshot and an illustration, yet encoding takes 9–46 seconds, 50–180 times the default, while jixel gets similar results in seconds; much of the cost comes from an iterative Butteraugli perceptual-metric loop.

Another urges patience, recalling how many years LAME took to mature and how WebP's early claims ended up trading familiar JPEG artifacts for new ones. A critic argues the sample F1 image shows AVIF erasing the car's highlights and replacing them with plausible content, though a reply says they could not see the problem at 100% zoom. One commenter reports that better encoders shrink the article's lossless JPEG XL files by 30–39%, and another says years of AVIF use for videogame screenshots generally compared favorably with JPEG XL at equal file size.

Selected comments: [yhjc2692](https://news.ycombinator.com/item?id=50121870) · [ezst](https://news.ycombinator.com/item?id=50123118) · [PaulHoule](https://news.ycombinator.com/item?id=50121407) · [boogerlad](https://news.ycombinator.com/item?id=50121607) · [linolevan](https://news.ycombinator.com/item?id=50124160) · [theandrewbailey](https://news.ycombinator.com/item?id=50121822)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50120224>)
