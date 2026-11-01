---
publish: true
content_type: "post"
title: "Multi-Token Prediction Done Right [R]"
description: "Sharing a paper on Multi-Token Prediction (MTP), now a standard recipe in frontier pre-training, showing it can be improved. The standard MTP gradient hides a KL self-distillation signal that benefits speculative decoding behind a noisy ..."
date: "2026-10-30T18:53:20.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:35:19.263Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1xjnz40/multitoken_prediction_done_right_r/"
tags: ["source/reddit","topics/models","topics/inference"]
---

Sharing a paper on Multi-Token Prediction &#40;MTP&#41;, now a standard recipe in frontier pre-training, showing it can be improved. The standard MTP gradient hides a KL self-distillation signal that benefits speculative decoding behind a noisy residual that harms next-token prediction. The authors introduce a KL gradient-recovery trick that extracts the KL gradient with a one-line change: h&#95;ntp += h&#95;mtp.detach&#40;&#41; - h&#95;mtp. The resulting Soft-MTP is described as a free lunch that improves MTP across a range of tasks. Code, paper and HuggingFace collection are linked.

## Media

![Image: Multi-Token Prediction Done Right &#91;R&#93;](<https://preview.redd.it/pdz8voy3inyh1.png?width=640&crop=smart&auto=webp&s=7d8a2253a12acb1611eeea6bf222da31a425cddf>)

[Image: Multi-Token Prediction Done Right &#91;R&#93;](<https://preview.redd.it/pdz8voy3inyh1.png?width=640&crop=smart&auto=webp&s=7d8a2253a12acb1611eeea6bf222da31a425cddf>)
