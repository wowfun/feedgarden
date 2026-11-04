---
publish: true
content_type: "post"
title: "LightMIS：面向边缘设备的超轻量医学图像分割 [R]"
description: "LightMIS 是一个拥有 131K 参数的二维二值医学图像分割模型，它直接聚合多尺度编码器特征，无需学习型的逐阶段解码器。在相同 nnU-Net 协议下，它的模态宏平均 Dice 与 IoU 接近 nnWNet，同时参数量减少 98.14%、GFLOPs 减少 94.58%。实验覆盖六个数据集与五种成像模态，轻量与重量级基线均使用 nnU-Net v2.3.1 从头训练。在搭载 Arm Mali-G52 MC2 GPU 的真实边缘设备上，完整 LightMIS 模型..."
date: "2026-11-02T20:22:30.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:00:52.900Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xm8dbo"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1xm8dbo/lightmis_ultralightweight_medical_image/"
tags: ["source/reddit","topics/health","topics/models","topics/inference"]
---

LightMIS 是一个拥有 131K 参数的二维二值医学图像分割模型，它直接聚合多尺度编码器特征，无需学习型的逐阶段解码器。在相同 nnU-Net 协议下，它的模态宏平均 Dice 与 IoU 接近 nnWNet，同时参数量减少 98.14%、GFLOPs 减少 94.58%。实验覆盖六个数据集与五种成像模态，轻量与重量级基线均使用 nnU-Net v2.3.1 从头训练。在搭载 Arm Mali-G52 MC2 GPU 的真实边缘设备上，完整 LightMIS 模型运行速度约为 nnWNet 的 10.5 倍，所有 LightMIS 变体均实现 100% GPU 算子覆盖且无 CPU 回退。源代码、检查点与复现细节均已公开。
