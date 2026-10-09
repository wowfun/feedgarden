---
publish: true
content_type: "post"
title: "Moonworks Lunara：对艺术智能进行建模 [R]"
description: "Lunara 被介绍为一种新颖的 Diffusion Mixture Transformer 架构，激活参数少于 100 亿，目标是面向图像生成对艺术智能进行建模。其 CAT 训练算法通过有针对性的样本获取、图像精修，以及有选择地纳入受人类创作艺术品启发的作品，来迭代更新训练分布，借鉴了主动学习的原理。语义变体会在保留共享内容的同时改变构图，从而提供受控的相关训练样本邻域。 评测使用 1,000 条共享提示词和 8,000 张生成图像，围绕审美质量、情感共鸣和内容完整性进行衡"
date: "2026-10-08T21:54:09.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x13zf7/moonworks_lunara_modeling_artistic_intelligence_r/"
tags: ["source/reddit","topics/models","topics/research","topics/evaluation"]
---

Lunara 被介绍为一种新颖的 Diffusion Mixture Transformer 架构，激活参数少于 100 亿，目标是面向图像生成对艺术智能进行建模。其 CAT 训练算法通过有针对性的样本获取、图像精修，以及有选择地纳入受人类创作艺术品启发的作品，来迭代更新训练分布，借鉴了主动学习的原理。语义变体会在保留共享内容的同时改变构图，从而提供受控的相关训练样本邻域。

评测使用 1,000 条共享提示词和 8,000 张生成图像，围绕审美质量、情感共鸣和内容完整性进行衡量，对比七个基线：GPT-Image-1 Mini、Qwen-Image、AuraFlow、SD 3.5 Turbo、HiDream-I1 Fast、FLUX-Klein-4B 和 Z-Image-Turbo。在 GPT-5.6 Sol 评测下，Lunara 在审美质量上领先，得分为 8.473，而 GPT-Image-1 Mini 为 8.457，Qwen-Image 为 8.366；GPT-Image-1 Mini 在情感共鸣和内容完整性上领先。在盲测人工评估中，六名评测者对匿名图像对进行评估，Lunara 在三个维度上都取得了最高平均分。

此次发布是在两个开源数据集发布之后进行的，前两个数据集曾登上 Hugging Face 首页。作者表示，希望论文中的发现能推动更多关于主动学习和基于混合架构的图像生成研究。文中引用的是该论文和一个 Hugging Face 评测数据集。
