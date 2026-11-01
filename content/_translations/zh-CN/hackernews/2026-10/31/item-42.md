---
publish: true
content_type: "post"
title: "Jepsen：ParticleDB 1.1.4"
description: "Jepsen 测试了 Orkes 开发的 ParticleDB，这是一个面向 AI 工作负载与工作流编排的 Rust 多模型数据库，版本范围为 1.1.4 至 1.1.18.11.rc-22。报告认为其“完整 ACID”宣传为时过早，记录了 96 个问题，包括崩溃、死锁、数据丢失，以及部分不可见行、删除后扭曲重现的表、列混淆和字符串变为整数等异常。大多数问题在单服务器、单客户端、无故障条件下即可复现。到 1.1.18.11.rc-22，除十个问题外其余似乎已解决。但仍有..."
date: "2026-10-31T13:39:52.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://jepsen.io/analyses/particledb-1.1.4"
discussion_url: "https://news.ycombinator.com/item?id=50316100"
tags: ["source/hackernews","topics/databases","topics/evaluation"]
---

## 正文提炼

Jepsen 测试了 Orkes 开发的 ParticleDB，这是一个面向 AI 工作负载与工作流编排的 Rust 多模型数据库，版本范围为 1.1.4 至 1.1.18.11.rc-22。报告认为其“完整 ACID”宣传为时过早，记录了 96 个问题，包括崩溃、死锁、数据丢失，以及部分不可见行、删除后扭曲重现的表、列混淆和字符串变为整数等异常。大多数问题在单服务器、单客户端、无故障条件下即可复现。到 1.1.18.11.rc-22，除十个问题外其余似乎已解决。但仍有两类严重问题：默认的乐观并发控制事务模式下，正常操作仍会丢失已提交写入；即使使用最强的可串行化隔离级别，仍允许内部异常和丢失更新。Orkes 随后发布 1.1.19-rc.13，并称其修复了报告中所有剩余问题。ParticleDB 试图在一个引擎中统一事务 SQL、键值存储、向量搜索、实时分析和名为 Particles 的用户自定义函数，可通过 Postgres、Redis 协议及 gRPC/HTTP2 接入，声称比 Postgres 快数个数量级。它最初是为 Orkes 的 Conductor 平台构建的有限 1.0.0，随后为更广泛发布进行重构；由于复制功能仅限企业云部署，Jepsen 仅测试了单节点构建。安全声明也存在不一致：承诺的 TLA+ 形式化证明在协作期间不可得，而关于 groupsync 预写日志同步模式的持久性描述在不同文档中互相矛盾。Jepsen 建议停止进一步部署、尽快迁移到其他数据库，并在可能时从更可靠来源检查或重建数据库状态。研究由 Orkes 资助，并遵循 Jepsen 伦理政策。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者呼应了报告的严重性：the&#95;duke 引用了频繁且深刻的事务异常，包括丢失已提交写入以及追加工作负载中的循环异常。amluto 认为 ParticleDB 看起来是“构造上就不正确”，其安全性依赖于运气和变通，而非整体合理的设计。wofo 和 Voultapher 将缺陷与“vibecoding”和 AI 辅助开发联系起来，而 semiquaver 反驳说，把抽象层上移是一个非平凡的过程，LLM 容易生成看似合理但质量差的代码。edude03 指出 96 个问题超过数据库报告的常见规模，质疑稳定版是否应有这么多问题。tensegrist 强调了“形式化证明”背后缺失的 TLA+ 规范。Betelbuddy 嘲讽投资者尽职调查不足。该样本显示强烈批评，但没有独立验证或 Orkes 的回应。

评论来源：[the&#95;duke](https://news.ycombinator.com/item?id=50318160) · [amluto](https://news.ycombinator.com/item?id=50319470) · [wofo](https://news.ycombinator.com/item?id=50319040) · [Voultapher](https://news.ycombinator.com/item?id=50325323) · [edude03](https://news.ycombinator.com/item?id=50317862) · [tensegrist](https://news.ycombinator.com/item?id=50318544)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50316100>)
