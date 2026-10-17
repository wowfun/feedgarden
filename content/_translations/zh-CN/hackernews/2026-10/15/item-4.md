---
publish: true
content_type: "post"
title: "Go 1.27 改进了 HTTP/1 连接复用"
description: "评论主要围绕连接处理与标准库走向。giancarlostoro 对这一改动表示欢迎，并追问 HTTP/3 何时进入标准库，称赞 Go 开箱即用的 HTTP 支持是其普及的关键；brainzap 回复说，据说为此正在进行 net/http 的清理工作。 jerf 认为该行为出人意料，而且 net/http 本身似乎没有给出文档说明，称这是客户端常见疑问，并询问如何在不排空不会复用 socket 的情况下强制关闭连接。jchw 则认为 Close 层级过高、不适合承载这类文..."
date: "2026-10-14T16:29:33.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://go.dev/blog/http-connection-reuse"
discussion_url: "https://news.ycombinator.com/item?id=50090369"
tags: ["source/hackernews","topics/coding","topics/inference","topics/open-source"]
---

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论主要围绕连接处理与标准库走向。giancarlostoro 对这一改动表示欢迎，并追问 HTTP/3 何时进入标准库，称赞 Go 开箱即用的 HTTP 支持是其普及的关键；brainzap 回复说，据说为此正在进行 net/http 的清理工作。

jerf 认为该行为出人意料，而且 net/http 本身似乎没有给出文档说明，称这是客户端常见疑问，并询问如何在不排空不会复用 socket 的情况下强制关闭连接。jchw 则认为 Close 层级过高、不适合承载这类文档，因为在 HTTP/2 中请求生命周期与底层 socket 并无绑定；若想立即关闭，直接强制关闭底层连接更合逻辑。gandreani 打趣说，Go 团队可能是在现实中接连遇到越来越丑陋的 drainAndCloseBody 变体之后才下决心实现自动复用，而第三个变体还涉及 HTTP/2 连接。

至于陷阱，rkuska 提醒，使用 json.Decoder 仍可能失去复用机会：解码器只读取部分正文，尾部换行可能残留未读。hxtk 回应说，Decoder 本就不适合该场景，因为读取方未必只含一个带后缀的 JSON 文档，并指出 encoding/json/v2 中的 UnmarshalRead 才是合适工具。jamesponddotco 和 aleksi 则说自己终于可以退役自写的排空辅助函数。

评论来源：[giancarlostoro](https://news.ycombinator.com/item?id=50094920) · [jerf](https://news.ycombinator.com/item?id=50092129) · [jchw](https://news.ycombinator.com/item?id=50092359) · [gandreani](https://news.ycombinator.com/item?id=50093313) · [rkuska](https://news.ycombinator.com/item?id=50092268) · [hxtk](https://news.ycombinator.com/item?id=50095547)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50090369>)
