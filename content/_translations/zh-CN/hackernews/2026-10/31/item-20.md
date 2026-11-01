---
publish: true
content_type: "post"
title: "Sanstun：Rust 实现的无 I/O、并行友好的 WireGuard"
description: "Sanstun 是 Firezone 发布的全新 WireGuard 状态机实现，采用 Rust 编写并遵循 sans-IO 设计模式。sans-IO 的核心思想是将 I/O 与副作用从状态和业务逻辑中彻底分离，从而让组件更易于测试、组合，并能在不同语言中应用，同时也能良好地配合 Rust 的所有权机制。 该项目源于 Firezone 多年维护和改造 boringtun 的经验。随着产品需求变化，要在保持与上游 API 完全兼容的前提下新增功能（如完全无 I/O 的时间..."
date: "2026-10-30T21:30:00.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://www.firezone.dev/blog/introducing-sanstun"
discussion_url: "https://news.ycombinator.com/item?id=50310398"
tags: ["source/hackernews","topics/coding","topics/security-privacy"]
---

## 正文提炼

Sanstun 是 Firezone 发布的全新 WireGuard 状态机实现，采用 Rust 编写并遵循 sans-IO 设计模式。sans-IO 的核心思想是将 I/O 与副作用从状态和业务逻辑中彻底分离，从而让组件更易于测试、组合，并能在不同语言中应用，同时也能良好地配合 Rust 的所有权机制。

该项目源于 Firezone 多年维护和改造 boringtun 的经验。随着产品需求变化，要在保持与上游 API 完全兼容的前提下新增功能（如完全无 I/O 的时间处理）变得愈发困难。此外，boringtun 内部的自动会话缓冲也带来了难以控制的分配、模糊的调用时序等问题。为此，sanstun 移除了内部缓冲，转而提供显式 API：由调用方负责握手发起、数据封装与解封装、超时处理以及事件轮询，覆盖 WireGuard 的四种消息类型。

这种设计让 I/O 策略完全交由使用者决定，更适合在异步、阻塞或模拟环境中灵活组合。sanstun 并非改动 WireGuard 协议本身，而是重新梳理了其在用户空间的集成接口，旨在提供一个更可预测、更易测试且更适合并行使用的构建模块。这种重构既保留了 WireGuard 的简洁性，也为实际工程落地带来了更大的可控性。

## HN 热门讨论

根据 8 条选取的评论与回复整理。

讨论主要围绕 sans-IO 的设计理念展开。Twey 对文章中声称能避免函数着色的说法提出异议，认为 async 本质上也是构建确定性状态机的方式，在跨越 await 点时仍会遇到类型约束。wh33zle 则反驳，指出一旦使用 async，状态机就会收束到单一的 poll API，如果想在两个状态转换之间插入外部状态变化，就不得不借助通道或共享 Mutex，远不如显式的 sans-IO API 那样灵活。monocasa 表示认同，认为这种方式更利于测试、能在异步和阻塞 I/O 间复用逻辑，并更容易限制 unsafe 代码的使用范围。temp0826 补充道，Mullvad 也基于 boringtun 独立开发了 gotatun，表明业界对这类 WireGuard 实现的改进都颇为关注。

评论来源：[Twey](https://news.ycombinator.com/item?id=50312268) · [wh33zle](https://news.ycombinator.com/item?id=50312375) · [monocasa](https://news.ycombinator.com/item?id=50311406) · [temp0826](https://news.ycombinator.com/item?id=50310928)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50310398>)
