---
publish: true
content_type: "post"
title: "FastBench: Benchmarking Streaming VLMs on High-Dynamic Real-World Video"
description: "Streaming video large language models (VLMs) support continuous video understanding, but existing benchmarks emphasize low-dynamic scenarios. Under bounded context budgets, models must trade off temporal history, spatial resolution and temp"
date: "2026-10-08T17:55:20.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:52.195Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12427v1"
tags: ["source/arxiv","topics/evaluation","topics/models","topics/inference"]
---

Streaming video large language models &#40;VLMs&#41; support continuous video understanding, but existing benchmarks emphasize low-dynamic scenarios. Under bounded context budgets, models must trade off temporal history, spatial resolution and temporal granularity, and sparse sampling at 1-2 FPS misses fast events. The authors introduce FastBench to evaluate high-dynamic perception in real-world streams.

FastBench uses a trajectory-grounded pipeline: QA generation from high-FPS clips, filtering of questions that are answerable at 2 FPS, answer verification with SAM3 and CoTracker3 trajectories, and three rounds of human inspection. The benchmark contains 306 QA pairs across eight domains, six capabilities and forward, instant and backward temporal scopes, with human-annotated evidence intervals.

The paper also presents ProactiveFrame, a training-free baseline that adjusts incoming frame rates through text tokens; a dual-tier sliding window keeps recent high-FPS observations while downsampling older ones into sparse history. Results show substantial limitations: the strongest model, Gemini-3.5-Flash, scores only 50.7%. Denser sampling lifts Qwen3-VL-8B from 32.9% at 2 FPS to 44.6% at 24 FPS, but gains saturate as history is compressed. ProactiveFrame beats sparse uniform sampling by 5.4 and 1.5 percentage points, yet stays well below oracle-guided focusing, indicating current VLMs struggle to decide from the stream alone when finer temporal perception is needed. Code and data are released with the benchmark.
