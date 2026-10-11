---
publish: true
content_type: "post"
title: "HeyGen Video 1.0"
description: "HeyGen has introduced HeyGen Video, a general-purpose video model built on MiniMax H3 and post-trained by HeyGen. Given a single prompt it generates an entire scene -- subject, setting, light and sound -- in one call. Each clip runs 5 to 15"
date: "2026-10-08T18:19:42.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://developers.heygen.com/docs/models/heygen-video"
discussion_url: "https://news.ycombinator.com/item?id=50009758"
tags: ["source/hackernews","topics/models","topics/products","topics/inference"]
---

## Article

HeyGen has introduced HeyGen Video, a general-purpose video model built on MiniMax H3 and post-trained by HeyGen. Given a single prompt it generates an entire scene -- subject, setting, light and sound -- in one call. Each clip runs 5 to 15 seconds and carries its own audio track combining dialogue, ambience and sound effects, so there is no separate speech pass, lip-sync step or avatar to choose.

The model is identified as heygen-video-1 and is offered in three modes: text&#95;to&#95;video takes a prompt and returns a new scene with its sound; image&#95;to&#95;video takes a prompt plus one image and returns a clip that opens on that image as its first frame; reference&#95;to&#95;video takes a prompt plus supplied images, videos or audio and returns a new scene that preserves the products, people or places provided. HeyGen positions it as distinct from the avatar rendering engines behind POST /v3/videos, which animate a look you already own from a script you already wrote.

API details: create with POST /v3/models/videos, retrieve with GET /v3/models/videos/&#123;video&#95;id&#125;, authenticate with an x-api-key header, and use the scopes videos:write, videos:read and assets:write. Submissions return 202; an Idempotency-Key header makes retries safe, with a same-key retry inside 24 hours returning the original response and a concurrent duplicate returning 409. Polling shows pending, processing, then a terminal completed, failed or cancelled state with a failure&#95;code and failure&#95;message. video&#95;url is a signed link that must be refreshed by polling again. An unknown or other-workspace ID returns 404, and jobs are also readable through GET /v3/videos/&#123;video&#95;id&#125; with a title taken from the first 64 characters of the prompt.

According to the source, the model is strongest on short, contained shots -- one subject, one place, one action, a locked or barely moving camera -- and least reliable on long on-screen text, soft organic motion such as petals, paper and hair, and close hand work like assembling or operating equipment. On prompting, the guidance is that long prompts beat short ones: a few hundred to a few thousand characters gives materially better output with no penalty for detail. For style, the recommended technique is to name a real production process and the physical marks it leaves, restrict the palette and rule out the smooth digital default; the launch films demonstrated this by shooting the same driver close-up in four media and by taking one drawing from pencil to oil paint to a clay model, each step an image&#95;to&#95;video shot starting from the last frame of the previous one. Short phrases of on-screen text, spelled out exactly, render reliably. Jobs can also notify a callback&#95;url with a callback&#95;id of at most 256 characters.

## Images and video

- [Image](<https://mintcdn.com/heygen-1fa696a7/hfMXXwJzjE7vBSYZ/images/theme/research-3.webp?fit=max&auto=format&n=hfMXXwJzjE7vBSYZ&q=85&s=c8191ba4743fd85050f1af1a93ed4969>)
