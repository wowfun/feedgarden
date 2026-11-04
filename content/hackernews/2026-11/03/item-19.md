---
publish: true
content_type: "post"
title: "uBlock Origin filter to block autoplay videos in TechCrunch"
description: "cornfieldlabs posted uBlock Origin filters that stop TechCrunch articles from autoplaying a JW Player video embedded in the middle of posts. Hiding the player is not enough because it keeps running in the background; blocking its scripts..."
date: "2026-11-03T07:36:47.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50349155"
source_url: "https://cornfieldlabs.github.io/posts/ublock-stop-techcrunch-autoplay-video/post.html"
discussion_url: "https://news.ycombinator.com/item?id=50349155"
tags: ["source/hackernews","topics/security-privacy"]
---

## Article

cornfieldlabs posted uBlock Origin filters that stop TechCrunch articles from autoplaying a JW Player video embedded in the middle of posts. Hiding the player is not enough because it keeps running in the background; blocking its scripts prevents loading, and cosmetic rules hide the empty box left behind. The network rules block scripts from content.jwplatform.com, ssl.p.jwpcdn.com and connatix.com &#40;the latter serving a floating ad player&#41;, with two cosmetic selectors on techcrunch.com. They require the full MV2 uBlock Origin build on Firefox, not uBO Lite, and are applied via Dashboard → My filters. The author notes that if TechCrunch switches video vendors, the cosmetic rules will likely still hide the box, but a new network rule will be needed to stop audio.

## HN discussion

Based on 9 selected comments and replies.

Commenters compared ways to stop autoplay media. ghtjason said Firefox's built-in autoplay blocking works for most sites, but Aardwolf replied that it mutes audio while still playing video, requiring extra clicks to get sound. thetallgeek installs uBlock Origin first on any machine, and KellyCriterion recalled an ad-tech employee who used an ad blocker to escape his own company's ads. Jakob argued disabling JavaScript by default removes the problem and makes pages faster and cleaner. Good4boothee noted manually blocking autoplay can leave invisible video playing sound, and that filter lists break quickly after site changes.

Selected comments: [ghtjason](https://news.ycombinator.com/item?id=50349246) · [Aardwolf](https://news.ycombinator.com/item?id=50350746) · [thetallgeek](https://news.ycombinator.com/item?id=50349404) · [KellyCriterion](https://news.ycombinator.com/item?id=50349792) · [Jakob](https://news.ycombinator.com/item?id=50349524) · [Good4boothee](https://news.ycombinator.com/item?id=50350345)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50349155>)
