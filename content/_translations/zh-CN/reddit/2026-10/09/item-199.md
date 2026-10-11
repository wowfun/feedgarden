---
publish: true
content_type: "post"
title: "DLoop：循环式投机解码"
description: "一篇新论文 DLoop 针对大语言模型投机解码中的无效计算。 投机解码通过让轻量草稿模型在起草阶段提出 token，再由目标模型验证，从而加速自回归生成。作者发现，随着草稿模型能力增强，目标模型经常接受起草阶段产生的全部 token，但每个起草阶段之后仍会执行一次验证，即便本可继续起草，也造成多余的目标模型前向传播。 自适应草稿长度方法会在解码过程中决定多少次草稿 token 之后进行一次验证，但作者指出，这类方法仅对自回归草稿模型提升加速比。对于并行草稿模型，要继续起草就需"
date: "2026-10-09T07:18:42.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1eu7o/paper_dloop_looped_speculative_decoding/"
tags: ["source/reddit","topics/inference","topics/research"]
---

一篇新论文 DLoop 针对大语言模型投机解码中的无效计算。

投机解码通过让轻量草稿模型在起草阶段提出 token，再由目标模型验证，从而加速自回归生成。作者发现，随着草稿模型能力增强，目标模型经常接受起草阶段产生的全部 token，但每个起草阶段之后仍会执行一次验证，即便本可继续起草，也造成多余的目标模型前向传播。

自适应草稿长度方法会在解码过程中决定多少次草稿 token 之后进行一次验证，但作者指出，这类方法仅对自回归草稿模型提升加速比。对于并行草稿模型，要继续起草就需要尚未验证的草稿 token 对应的目标模型隐藏状态。

DLoop 提出一种循环式投机解码：在验证之前自适应地执行多个起草阶段。只要草稿模型保持自信就继续起草，然后将累积的全部草稿 token 一起验证。循环感知训练通过让草稿模型接触未验证草稿 token 自身的隐藏状态，使其在额外起草阶段仍保持可靠。该方法以额外的草稿模型前向传播换取更少的目标模型前向传播。

在 EAGLE-3、DFlash、Domino、DSpark 以及多 token 预测模块等多种投机解码方法上，DLoop 据报将实际加速比提升 5% 至 41%，同时保持无损解码。代码正在内部审核，即将发布。

## 图片与视频

- [图片: &#91;Paper&#93; DLoop: Looped Speculative Decoding](<https://preview.redd.it/qt7fjeyd7euh1.png?width=140&height=72&auto=webp&s=28336cf2022f41d9d09c7311db0f5738931eda30>)
