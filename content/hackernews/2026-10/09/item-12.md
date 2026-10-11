---
publish: true
content_type: "post"
title: "Frontier AI models outperform analysts on earnings prediction"
description: "Samaya describes a research effort testing whether AI models can predict financial results, arguing the results mark an inflection point: the latest frontier models, run inside the company's finance-specific harness, outperform expert analy"
date: "2026-10-08T17:33:29.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://samaya.ai/blog/frontier-ai-models-outperform-human-experts-on-earnings-prediction"
discussion_url: "https://news.ycombinator.com/item?id=50008977"
tags: ["source/hackernews","topics/models","topics/research","topics/evaluation"]
---

## Article

Samaya describes a research effort testing whether AI models can predict financial results, arguing the results mark an inflection point: the latest frontier models, run inside the company's finance-specific harness, outperform expert analysts at predicting earnings surprises. The author frames finance as one of the largest and hardest areas of knowledge work, and notes that predicting markets accurately requires large amounts of high-quality, real-time financial information.

The report explains the task. Global stock markets are worth more than &#36;150 trillion, and more than ten thousand public companies report quarterly metrics such as revenue, gross margin, operating income and adjusted EPS, collectively called actuals. Analysts model and publish forecasts ahead of earnings; their average is the consensus estimate. When a company reports, the actual is a beat or a miss relative to consensus, and the gap is the earnings surprise the market reacts to. Because even the best consensus misses, it serves as a strong, feasible human baseline.

To make the comparison meaningful, Samaya built a finance-specific prediction harness and environment that supplies comprehensive point-in-time financial information at parity with human experts, so models see only data available up to the decision point. Models make predictions one week before earnings and are asked to forecast four headline metrics. The main figure compares prediction error for reported company revenue against two baselines: raw analyst consensus, described as the unadjusted human baseline, and bias-corrected consensus, described as a stronger baseline, across 456 Q2 earnings releases. Errors are adjusted for each company's surprise volatility &#40;sigma&#41;. The reported trend is that error decreases with more capable models, and the most recent models beat even the bias-corrected consensus. The article notes that ground-truth actuals, a human baseline, and management-disclosed surprise drivers make earnings prediction useful for examining whether a model's reasoning was correct.

## HN discussion

Based on 2 selected comments and replies.

The small sample centers on what the models were actually given. One commenter asked whether the models were scored on published numbers or whether the analysts had access to the circular financing portion of the money flow, implying a possible informational asymmetry behind the comparison. The author replied briefly that it was published numbers only.

Selected comments: [cyanydeez](https://news.ycombinator.com/item?id=50010681) · [ashwinpp](https://news.ycombinator.com/item?id=50012001)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50008977>)

## Images and video

- [Image: Figure 1. Recent AI models are able to predict earnings better than human experts. The plot shows prediction error of company revenue as reported in earnings compared to &#40;i&#41; raw analyst consensus &#40;the unadjusted human baseline&#41; and &#40;ii&#41; bia](<https://samaya.ai/images/migrated/earnings-prediction-cover.png>)
