---
publish: true
content_type: "post"
title: "我构建了 ALHR：一个基于树的稀疏注意力系统，在保持准确率的同时实现亚二次推理 [P]"
description: "ALHR（Adaptive Learnable Hierarchical Routing，自适应可学习分层路由）是一个稀疏注意力系统，利用静态二叉树和可学习函数来最小化每个查询需要读取的 key 数量。作者指出，它在训练第一阶段依赖一个稠密教师模型。 在 1,024 token 的 MQAR 测试中，稠密基线每个查询平均读取 512 个 key，top-1 准确率为 94.9%；ALHR 每个查询平均读取 30 个 key，top-1 准确率为 92.1%。这相当于 35.3"
date: "2026-10-09T13:29:43.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x1lem3/i_built_alhr_a_tree_based_sparse_attention_system/"
tags: ["source/reddit","topics/inference","topics/research"]
---

ALHR（Adaptive Learnable Hierarchical Routing，自适应可学习分层路由）是一个稀疏注意力系统，利用静态二叉树和可学习函数来最小化每个查询需要读取的 key 数量。作者指出，它在训练第一阶段依赖一个稠密教师模型。

在 1,024 token 的 MQAR 测试中，稠密基线每个查询平均读取 512 个 key，top-1 准确率为 94.9%；ALHR 每个查询平均读取 30 个 key，top-1 准确率为 92.1%。这相当于 35.3 倍的 KV 压缩，即只读取 2.83% 的 key，作者还报告 ALHR 的缓存压缩为 100%。稠密模型峰值显存为 57 MB，且按二次方增长；ALHR 为 422 MB，按线性增长。

作者说明了局限：全规模测试尚未完成；训练仍然是二次复杂度，而推理将是 N log N，这与仓库日志中的记录一致。用于运行该测试的真实日志和 Kaggle notebook 单元包含在仓库的 logs 文件夹中。
