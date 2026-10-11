---
publish: true
content_type: "post"
title: "前沿 AI 模型在盈利预测上超过分析师"
description: "Samaya 介绍了一项测试 AI 模型能否预测财务结果的研究，并认为结果标志着一个临界点：在自家为金融专门构建的运行框架中，最新的前沿模型在预测盈利意外方面超过了专业分析师。作者把金融视为规模最大、难度最高的知识工作领域之一，并指出准确预测市场需要大量高质量的实时金融信息。 报告解释了任务设定。全球股票市场总值超过 150 万亿美元，一万多家上市公司每季度公布营收、毛利率、营业利润和调整后每股收益等指标（即 actuals）。分析师在财报前建模并发布预测，其平均值构成市场一"
date: "2026-10-08T17:33:29.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://samaya.ai/blog/frontier-ai-models-outperform-human-experts-on-earnings-prediction"
discussion_url: "https://news.ycombinator.com/item?id=50008977"
tags: ["source/hackernews","topics/models","topics/research","topics/evaluation"]
---

## 正文提炼

Samaya 介绍了一项测试 AI 模型能否预测财务结果的研究，并认为结果标志着一个临界点：在自家为金融专门构建的运行框架中，最新的前沿模型在预测盈利意外方面超过了专业分析师。作者把金融视为规模最大、难度最高的知识工作领域之一，并指出准确预测市场需要大量高质量的实时金融信息。

报告解释了任务设定。全球股票市场总值超过 150 万亿美元，一万多家上市公司每季度公布营收、毛利率、营业利润和调整后每股收益等指标（即 actuals）。分析师在财报前建模并发布预测，其平均值构成市场一致预期（consensus）。公司公布业绩时，实际值高于或低于一致预期即为 beat 或 miss，两者之差就是市场所反应的盈利意外。由于即使最好的一致预期也会失手，它构成了一个强有力的、可行的人类基线。

为使对比有意义，Samaya 构建了面向金融的预测框架与环境，提供与人类专家对等的、完整的时点（point-in-time）金融信息，使模型只能看到决策时点之前可获得的数据。模型在财报前一周做预测，需要给出四项核心指标。主图对比了已公布营收的预测误差与两个基线：原始分析师一致预期（未调整的人类基线）和偏差修正后的一致预期（更强的基线），覆盖 456 份第二季度财报。误差按各公司的意外波动率（sigma）进行了调整。报告称误差随模型能力提升而下降，最新模型甚至超过了偏差修正基线。文章还指出，真实的实际数据、人类基线以及管理层披露的意外驱动因素，使盈利预测这一任务适合用来考察模型的推理过程是否正确。

## HN 热门讨论

根据 2 条选取的评论与回复整理。

这个较小的样本主要围绕模型究竟获得了什么信息。有评论者问，模型是基于已公开数字评估的，还是分析师能够看到资金流中的循环融资部分，暗示这一对比背后可能存在信息不对称。作者简短回复称只用了公开数字。

评论来源：[cyanydeez](https://news.ycombinator.com/item?id=50010681) · [ashwinpp](https://news.ycombinator.com/item?id=50012001)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50008977>)

## 图片与视频

- [图片: Figure 1. Recent AI models are able to predict earnings better than human experts. The plot shows prediction error of company revenue as reported in earnings compared to &#40;i&#41; raw analyst consensus &#40;the unadjusted human baseline&#41; and &#40;ii&#41; bia](<https://samaya.ai/images/migrated/earnings-prediction-cover.png>)
