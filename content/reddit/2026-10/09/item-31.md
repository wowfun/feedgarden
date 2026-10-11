---
publish: true
content_type: "post"
title: "Testing Strata vs llama.cpp vs runner, and the missing piece was the MTP head"
description: "A user comparing inference runtimes on the same model concluded that the MTP (multi-token prediction) head accounts for part of Strata's speed advantage — something they say may be obvious to others but was not to them. To make a fair compa"
date: "2026-10-08T19:21:00.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x102lo/i_was_doing_some_testing_on_strata_vs_llama_vs/"
tags: ["source/reddit","topics/inference","topics/models","topics/evaluation"]
---

A user comparing inference runtimes on the same model concluded that the MTP &#40;multi-token prediction&#41; head accounts for part of Strata's speed advantage — something they say may be obvious to others but was not to them.

To make a fair comparison, they produced an MTP head for the GGUF from ISTA-DASLab that Strata uses. While doing so, they also produced a head for one of their own quants, and report that llama.cpp saw a big speed gain from it. The related artifacts are published as Joakimpalm-Zen/Qwen3.8-27B-GSQ-RCO-IQ3&#95;S-recovered-GGUF.

They also worked on the larger ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF, with the MTP head published under Joakimpalm-Zen/Qwen3.8-Flash-Next-MTP-GGUF. With that head, llama.cpp showed some improvement, but they state Strata remained much faster overall.

They note their own runner still needs architectural improvements and describe the comparison as informal work-in-progress, sharing the heads in case others find them useful. The post gives no absolute throughput figures and does not isolate how much of Strata's lead is due to the MTP head versus other runtime factors.

## Images and video

- [Image: I was doing some testing on Strata. vs llama vs. runner and was missing something](<https://external-preview.redd.it/2JSAVBQaRmK73TWaNAeqZNmHfOq8wHZTFYyM2kuW9U0.png?width=140&height=75&auto=webp&s=96969ae7399b9baaddc41ac3452d3c70068ff358>)
