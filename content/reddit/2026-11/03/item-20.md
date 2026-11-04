---
publish: true
content_type: "post"
title: "LightMIS: Ultra-lightweight medical image segmentation for edge devices [R]"
description: "LightMIS is a 2D binary medical image segmentation model with 131K parameters that aggregates multi-scale encoder features directly, without a learned stage-wise decoder. Under the same nnU-Net protocol, it achieves close modality-macro ..."
date: "2026-11-02T20:22:30.000Z"
updated: "2026-11-04T16:00:39.769Z"
first_seen: "2026-11-04T16:00:52.900Z"
date_basis: "published"
feed_source: "reddit"
feed_source_id: "t3_1xm8dbo"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1xm8dbo/lightmis_ultralightweight_medical_image/"
tags: ["source/reddit","topics/health","topics/models","topics/inference"]
---

LightMIS is a 2D binary medical image segmentation model with 131K parameters that aggregates multi-scale encoder features directly, without a learned stage-wise decoder. Under the same nnU-Net protocol, it achieves close modality-macro Dice and IoU averages to nnWNet while using 98.14% fewer parameters and 94.58% fewer GFLOPs. Experiments covered six datasets and five imaging modalities, with both lightweight and heavyweight baselines trained from scratch using nnU-Net v2.3.1. On a real edge device with an Arm Mali-G52 MC2 GPU, the full LightMIS model ran about 10.5× faster than nnWNet, and all LightMIS variants achieved 100% GPU operator coverage with no CPU fallback. Code, checkpoints and reproduction details are publicly available.
