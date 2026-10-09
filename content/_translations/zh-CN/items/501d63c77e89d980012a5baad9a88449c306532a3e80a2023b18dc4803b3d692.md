---
publish: true
content_type: "post"
title: "Stepped MoE：具有可配置推理复杂度的段级路由"
description: "一篇新论文 Stepped MoE 将弹性结构与稀疏门控架构统一起来，使单一模型能够同时适应部署约束和任务需求。 作者指出，大语言模型训练资源消耗巨大，而要让其适应算力预算各异的部署场景也很困难。弹性架构支持灵活部署，稀疏激活模型支持输入自适应计算，但现有方法把这两个维度相互独立地处理。面向端侧设备推理的模型还必须符合服务设备的内存与算力限制。 Stepped MoE 使用一个同时以上下文和目标效率规格为条件的模型主干，从而在推理时对精度—效率权衡进行细粒度控制。模型学会在弹"
date: "2026-10-09T07:39:16.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1f5gz/paper_stepped_moe_segmentlevel_routing_with/"
tags: ["source/reddit","topics/models","topics/inference"]
---

一篇新论文 Stepped MoE 将弹性结构与稀疏门控架构统一起来，使单一模型能够同时适应部署约束和任务需求。

作者指出，大语言模型训练资源消耗巨大，而要让其适应算力预算各异的部署场景也很困难。弹性架构支持灵活部署，稀疏激活模型支持输入自适应计算，但现有方法把这两个维度相互独立地处理。面向端侧设备推理的模型还必须符合服务设备的内存与算力限制。

Stepped MoE 使用一个同时以上下文和目标效率规格为条件的模型主干，从而在推理时对精度—效率权衡进行细粒度控制。模型学会在弹性嵌套的子网络中激活与任务相关的参数，因此一套权重即可覆盖多个容量点，同时保留输入自适应路由。

据报告结果，该模型可灵活使用 10 亿、20 亿、30 亿或 40 亿参数配置，同时在知识密集型基准上比稠密对照模型准确率高 2% 至 5%，并与静态版本持平，同时延迟与稠密模型相近。作者强调，共享模型参数可节省端侧磁盘空间，并可按可用 DRAM 和算力进行部署。

## 图片与视频

- [图片: &#91;Paper&#93; Stepped MoE: Segment-Level Routing with Configurable Inference Complexity](<https://preview.redd.it/60ambcj2beuh1.png?width=140&height=66&auto=webp&s=d2f5f5c8dff3468b0d93d6f85caad4b278c0eb29>)
