---
publish: true
content_type: "post"
title: "MiMo-2.6-Pro runs at 0.646 tokens/s on a 128 GB Jetson AGX Thor"
description: "An r/LocalLLaMA user got MiMo-2.6-Pro, a roughly 566 GB FP8 model, to load and run on a Jetson AGX Thor with 128 GB of memory at 0.646 tokens per second. The model is far larger than the device's RAM, so weights are read from disk during..."
date: "2026-10-16T21:18:51.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:52.494Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x7sbxs/dario_with_open_source_you_can_see_the_source/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/open-source"]
---

An r/LocalLLaMA user got MiMo-2.6-Pro, a roughly 566 GB FP8 model, to load and run on a Jetson AGX Thor with 128 GB of memory at 0.646 tokens per second. The model is far larger than the device's RAM, so weights are read from disk during inference, which the author describes as painfully slow. Even so, the run completed, and the poster says every decoder layer, routed expert and SSD read was traced and can be replayed step by step.

The post riffs on a Dario quote about open source letting people see the source code while closed models cannot be inspected, answering it with the line "Yeah, well, that's just, like, your opinion, man." The author jokes about moving from "hand-extruded hotdog" speeds toward a small local "hotdog factory" and wishes Dario well.
