---
publish: true
content_type: "post"
title: "Have URMs and UTs been integrated into frontier models? Or did they disappear into the dustbin of forgotten papers? [D]"
description: "A discussion post on r/MachineLearning asks whether the ideas behind the Universal Transformer (UT) and the Universal Reasoning Model (URM) have been taken up by frontier labs, or whether they remain overlooked research. It links the pap..."
date: "2026-10-08T20:28:20.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x11ufl/have_urms_and_uts_been_integrated_into_frontier/"
tags: ["source/reddit","topics/research","topics/models"]
---

A discussion post on r/MachineLearning asks whether the ideas behind the Universal Transformer &#40;UT&#41; and the Universal Reasoning Model &#40;URM&#41; have been taken up by frontier labs, or whether they remain overlooked research. It links the paper, a simplified blog explainer and a video talk.

The post recaps the UT mechanism: rather than stacking L distinct Transformer layers, the UT applies a single transition block repeatedly to refine token representations. Starting from an embedding matrix H0, it updates the state over T steps using layer normalization, multi-head attention and a shared position-wise transition function that can be a feed-forward network or separable convolution. Two-dimensional sinusoidal embeddings encode both token position and refinement depth.

For the URM, the cited figure shows a standard Transformer layer stack next to a recurrent design with fixed loops, ACT &#40;adaptive computation time&#41; loops and a ConvSwiGLU module, trained with the authors' truncated backpropagation through loops &#40;TBPTL&#41;. The post claims that UT-based small models, trained from scratch on these tasks without internet-scale pretraining, consistently outperform most standard Transformer LLMs by a significant margin, and asks whether large frontier labs have already implemented these enhancements.

Note: the performance claim and the framing are the poster's; the source offers no independent benchmark numbers or evidence of adoption.

## Media

![Video: https&#58;//www.youtube.com/watch?v=RxNPFCYCFBU](<https://www.youtube.com/watch?v=RxNPFCYCFBU>)

[Video: https&#58;//www.youtube.com/watch?v=RxNPFCYCFBU](<https://www.youtube.com/watch?v=RxNPFCYCFBU>)
