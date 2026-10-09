---
publish: true
content_type: "post"
title: "可承认“我不知道”的生产级检索流水线 [P]"
description: "r/MachineLearning 上的一篇帖子分享了一份清单，面向把检索增强生成（RAG）原型推向生产的团队，作者称这是自己当初迁移时最希望拥有的清单。帖子附带的视频讲解同一内容。 清单包含四项： - 每个回答都带有引用 - 当检索到的上下文不足以支撑回答时拒绝作答 - 无法被绕过的访问控制 - 摄取流程永不阻塞用户 帖子没有给出架构细节、量化指标、工具名称，也没有说明这些要求如何被验证，因此这份清单更适合作为检验流水线的要求集合，而不是已被验证的设计方案。"
date: "2026-10-08T17:55:50.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:47.429Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x0xt5x/production_grade_retrieval_pipeline_that_admits_i/"
tags: ["source/reddit","topics/coding","topics/products","topics/security-privacy"]
---

r/MachineLearning 上的一篇帖子分享了一份清单，面向把检索增强生成（RAG）原型推向生产的团队，作者称这是自己当初迁移时最希望拥有的清单。帖子附带的视频讲解同一内容。

清单包含四项：

- 每个回答都带有引用
- 当检索到的上下文不足以支撑回答时拒绝作答
- 无法被绕过的访问控制
- 摄取流程永不阻塞用户

帖子没有给出架构细节、量化指标、工具名称，也没有说明这些要求如何被验证，因此这份清单更适合作为检验流水线的要求集合，而不是已被验证的设计方案。

## 图片与视频

- [视频: https&#58;//youtu.be/-GK1e4KZqhw](<https://youtu.be/-GK1e4KZqhw>)
