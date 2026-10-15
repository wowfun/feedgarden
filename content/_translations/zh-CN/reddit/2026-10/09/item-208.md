---
publish: true
content_type: "post"
title: "我构建了 MaRN：一个通过低维参数映射训练神经网络的 PyTorch 库 [P]"
description: "MaRN（Mapping Networks）是一个 PyTorch 库，允许优化一个紧凑的隐表示，而不是直接训练每一个模型参数。作者报告了当前探索性基准的结果，其中部分任务使用合成数据，并声明这些基准并不能证明其相对直接训练具有普遍优越性。 在一个 MNIST CNN 上，537,748 参数的网络被缩减为 4,080 个可训练参数，缩减 131.8 倍，准确率从 99.07% 降至 98.10%（下降 0.97 个百分点）。一个更小的 107,998 参数 CNN 被..."
date: "2026-10-09T08:05:23.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x1fjrv/i_built_marn_a_pytorch_library_for_training/"
tags: ["source/reddit","topics/research","topics/coding"]
---

MaRN（Mapping Networks）是一个 PyTorch 库，允许优化一个紧凑的隐表示，而不是直接训练每一个模型参数。作者报告了当前探索性基准的结果，其中部分任务使用合成数据，并声明这些基准并不能证明其相对直接训练具有普遍优越性。

在一个 MNIST CNN 上，537,748 参数的网络被缩减为 4,080 个可训练参数，缩减 131.8 倍，准确率从 99.07% 降至 98.10%（下降 0.97 个百分点）。一个更小的 107,998 参数 CNN 被缩减为 1,872 个可训练参数，缩减 57.7 倍，准确率从 98.83% 降至 97.18%（下降 1.65 个百分点）。作者指出，映射模型训练速度可能明显变慢，且性能因任务而异。

该库包含全局与逐层映射、正则化选项，以及剪枝和低秩分解集成。作者希望获得关于方法、基准设计以及这类参数高效优化适用场景的反馈。
