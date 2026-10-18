---
publish: true
content_type: "post"
title: "MiMo-2.6-Pro 在 128 GB 的 Jetson AGX Thor 上以每秒 0.646 个 token 运行"
description: "一位 r/LocalLLaMA 用户让约 566 GB 的 FP8 模型 MiMo-2.6-Pro 在仅有 128 GB 内存的 Jetson AGX Thor 上加载并运行，速度仅为每秒 0.646 个 token。模型远大于设备内存，因此推理时需要从磁盘读取权重，作者形容这一过程极其缓慢。尽管如此，它确实跑完了；发帖者称每个解码器层、路由专家和 SSD 读取都被追踪，并可逐步重放。 帖子以玩笑方式回应 Dario 关于开源的言论——开源能看到源代码，而闭源模型内部不..."
date: "2026-10-16T21:18:51.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:52.494Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x7sbxs/dario_with_open_source_you_can_see_the_source/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/open-source"]
---

一位 r/LocalLLaMA 用户让约 566 GB 的 FP8 模型 MiMo-2.6-Pro 在仅有 128 GB 内存的 Jetson AGX Thor 上加载并运行，速度仅为每秒 0.646 个 token。模型远大于设备内存，因此推理时需要从磁盘读取权重，作者形容这一过程极其缓慢。尽管如此，它确实跑完了；发帖者称每个解码器层、路由专家和 SSD 读取都被追踪，并可逐步重放。

帖子以玩笑方式回应 Dario 关于开源的言论——开源能看到源代码，而闭源模型内部不可见——并用一句台词回敬：“Yeah, well, that's just, like, your opinion, man.” 作者还打趣说要把“手工挤热狗”般的速度提升为小型本地“热狗工厂”的速度，并祝 Dario 早日康复。
