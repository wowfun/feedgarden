---
publish: true
content_type: "post"
title: "多 Token 预测的正确做法 [R]"
description: "分享一篇关于多 Token 预测（MTP）的论文。MTP 已成为前沿预训练的标准做法，但作者认为它还可以做得更好。标准 MTP 梯度把有利于投机解码的 KL 自蒸馏信号隐藏在一个会损害下一 Token 预测的噪声残差之后。作者提出 KL 梯度恢复技巧，仅用一行代码改动 h_ntp += h_mtp.detach() - h_mtp 即可提取 KL 梯度。得到的 Soft-MTP 被称为“免费午餐”，在一系列任务上改进了 MTP。文中附有代码、论文和 HuggingFac..."
date: "2026-10-30T18:53:20.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:35:19.263Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1xjnz40/multitoken_prediction_done_right_r/"
tags: ["source/reddit","topics/models","topics/inference"]
---

分享一篇关于多 Token 预测（MTP）的论文。MTP 已成为前沿预训练的标准做法，但作者认为它还可以做得更好。标准 MTP 梯度把有利于投机解码的 KL 自蒸馏信号隐藏在一个会损害下一 Token 预测的噪声残差之后。作者提出 KL 梯度恢复技巧，仅用一行代码改动 h&#95;ntp += h&#95;mtp.detach&#40;&#41; - h&#95;mtp 即可提取 KL 梯度。得到的 Soft-MTP 被称为“免费午餐”，在一系列任务上改进了 MTP。文中附有代码、论文和 HuggingFace 集合链接。

## 媒体

![图片: Multi-Token Prediction Done Right &#91;R&#93;](<https://preview.redd.it/pdz8voy3inyh1.png?width=640&crop=smart&auto=webp&s=7d8a2253a12acb1611eeea6bf222da31a425cddf>)

[图片: Multi-Token Prediction Done Right &#91;R&#93;](<https://preview.redd.it/pdz8voy3inyh1.png?width=640&crop=smart&auto=webp&s=7d8a2253a12acb1611eeea6bf222da31a425cddf>)
