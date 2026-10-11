---
publish: true
content_type: "post"
title: "云端智能体"
description: "投稿介绍了一个名为 Agents in the Cloud 的项目，主张把编程智能体从单台笔记本搬进隔离的云环境中运行，而且不止一个，而是同时运行多个。其设想是：每个小任务都配一个全新环境，合上笔记本后智能体仍在工作，离开工位时也能获得不错的移动端体验，而所谓云端甚至可以只是用户放在柜子里的自己的电脑。该项目被描述为免费、开源、兼容任何模型和任何订阅，并给出了在 Mac 上或服务器上部署的两种入门方式。 这段很短的发布文字配的是终端与编辑器界面的示意：在 ~/app 下的一个"
date: "2026-10-08T20:29:23.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://agentsinthecloud.com/"
discussion_url: "https://news.ycombinator.com/item?id=50011738"
tags: ["source/hackernews","topics/agents","topics/coding","topics/open-source"]
---

## 正文提炼

投稿介绍了一个名为 Agents in the Cloud 的项目，主张把编程智能体从单台笔记本搬进隔离的云环境中运行，而且不止一个，而是同时运行多个。其设想是：每个小任务都配一个全新环境，合上笔记本后智能体仍在工作，离开工位时也能获得不错的移动端体验，而所谓云端甚至可以只是用户放在柜子里的自己的电脑。该项目被描述为免费、开源、兼容任何模型和任何订阅，并给出了在 Mac 上或服务器上部署的两种入门方式。

这段很短的发布文字配的是终端与编辑器界面的示意：在 &#126;/app 下的一个 Claude Code 会话读取 src/auth/login.test.ts，以 +3 −1 的差异修改 src/auth/login.ts，运行 npm test 得到 42 个测试通过，git status 只显示被改动的那个登录文件。画面中还有 Opus 与 Claude Max 订阅标识、包含 auth 与 api 文件的编辑器资源管理器面板，以及 localhost:3000/login 浏览器标签与 Ghostty 终端窗口。这些片段勾勒出预期的工作流：浏览器、终端和 VS Code 连接到远端环境，运行用户自选的编程智能体。

## HN 热门讨论

根据 2 条选取的评论与回复整理。

评论者认为提交页面不足以介绍这个项目，建议读者去看发布视频和 GitHub README。一位评论者称其设计考虑周全，似乎超越了现有的同类工具；他看重的亮点包括工作区之间隔离做得很好——每个工作区一个 Docker 容器，并且默认工作区之间没有网络通信——每个工作区可以使用用户偏好的编程智能体，以及一个改进了智能体自带界面的 Web 交互界面。

这些好评也附带了对项目治理的保留意见。同类工具的维护者表示，这个项目好到他一度考虑放弃自己的项目转而使用它，但贡献政策不到位，因为提交的 PR 和社交媒体上的讨论都没有下文。与其分叉并再背上一个维护负担，他计划把自己项目的维护节奏放慢到每月发布一次，紧急修复和 bug 修复除外，同时继续自动化部署，并维护针对各智能体的扩展和可用的网络功能。

评论来源：[rahimnathwani](https://news.ycombinator.com/item?id=50014358) · [rcarmo](https://news.ycombinator.com/item?id=50027272)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50011738>)
