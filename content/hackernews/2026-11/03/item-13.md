---
publish: true
content_type: "post"
title: "LLMs are not superhuman at reading and writing neural network weights"
description: "A blog post by HN user agrm responds to a paper claiming frontier LLMs can work directly with neural network weights, a capability that sounds superhuman and that some worry could enable recursive self-improvement. The author argues a sm..."
date: "2026-11-02T22:26:53.000Z"
updated: "2026-11-04T14:11:39.510Z"
first_seen: "2026-11-04T14:11:54.614Z"
date_basis: "published"
feed_source: "hackernews"
feed_source_id: "50344861"
source_url: "https://www.seangoedecke.com/llms-are-not-superhuman-at-reading-and-writing-neural-network-weights/"
discussion_url: "https://news.ycombinator.com/item?id=50344861"
tags: ["source/hackernews","topics/models"]
---

## Article

A blog post by HN user agrm responds to a paper claiming frontier LLMs can work directly with neural network weights, a capability that sounds superhuman and that some worry could enable recursive self-improvement. The author argues a smart human ML researcher could perform every demonstrated task, so the results are impressive but not fundamentally new or shocking to those following the field closely. The paper’s first example has GPT-6 Astra identify which games a small network was trained to play by inspecting its weights, and even edit those weights. The author contends this is tractable because the network’s input channels map directly onto an 8x8 grid, are labeled &#40;for example “agent” or “moving objects”&#41;, and first-layer weight norms can be computed in a few lines of Python to produce a heatmap showing where the player and moving objects are. Astra reportedly performed that calculation internally rather than running code, which the author calls neat but not impressive. The most impressive example is Astra improving a 0.8B Qwen model’s mathematics performance by editing weights. The author notes Qwen was not fundamentally bad at math; it got stuck in loops after 32k tokens, so longer math tasks always failed. Astra reportedly wrote four pairs of looping and non-looping reasoning texts, measured which weights contributed to looping, trimmed those weights, and found a patch that stopped the looping, letting the model work on math beyond 32k tokens. The author says this mirrors a human steering or abliteration approach and is what a competent researcher would do. The author concludes direct weight editing is like LLMs emitting or patching machine code: a cool trick, but normal training remains the best way to update model weights, and to the extent LLMs aid AI research they will do so by improving training.

## HN discussion

Based on 9 selected comments and replies.

Commenters debated whether speed alone makes the capability “superhuman.” nfw2 argued LLMs may do this work faster and more effectively than humans while still reasoning in legible, human-like steps, and antonvs added that such speed can produce qualitative leaps, citing LLMs grasping unfamiliar codebases in minutes versus months for humans. StilesCrisis and kenjackson pushed back on the article’s heatmap claim, saying they would not recognize games such as Pac-Man from weight norms, especially without labels. solyin highlighted the distinction between open weights and open source. simias countered that there is nothing magical about the computation, and that early coverage overstated LLMs’ native understanding of weights.

Selected comments: [nfw2](https://news.ycombinator.com/item?id=50346967) · [antonvs](https://news.ycombinator.com/item?id=50348309) · [StilesCrisis](https://news.ycombinator.com/item?id=50352071) · [kenjackson](https://news.ycombinator.com/item?id=50356284) · [solyin](https://news.ycombinator.com/item?id=50352336) · [simias](https://news.ycombinator.com/item?id=50351553)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50344861>)

## Media

![Image: fig1](<https://www.seangoedecke.com/llms-are-not-superhuman-at-reading-and-writing-neural-network-weights/J3JiNrBTkY-590.png>)

[Image: fig1](<https://www.seangoedecke.com/llms-are-not-superhuman-at-reading-and-writing-neural-network-weights/J3JiNrBTkY-590.png>)
